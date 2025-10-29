from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorCollection
from database import users_collection
from models import User, UserTier
import os
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

# OAuth clients - simplified for now, will implement proper OAuth later
# google_oauth = OAuthAuthorityClient(
#     client_id=os.getenv("GOOGLE_CLIENT_ID"),
#     client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
#     redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
#     base_url="https://accounts.google.com/o/oauth2/auth",
#     token_endpoint="https://oauth2.googleapis.com/token",
#     userinfo_endpoint="https://www.googleapis.com/oauth2/v2/userinfo"
# )

# github_oauth = OAuthAuthorityClient(
#     client_id=os.getenv("GITHUB_CLIENT_ID"),
#     client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
#     redirect_uri=os.getenv("GITHUB_REDIRECT_URI"),
#     base_url="https://github.com/login/oauth/authorize",
#     token_endpoint="https://github.com/login/oauth/access_token",
#     userinfo_endpoint="https://api.github.com/user"
# )

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = await users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    return User(**user)

async def authenticate_user(email: str, password: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return User(**user)

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password_hash": hashed_password,
        "tier": UserTier.FREE,
        "usage_count": 0,
        "created_at": datetime.utcnow(),
        "last_reset": datetime.utcnow()
    }
    result = await users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)

    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    user_obj = await authenticate_user(user.email, user.password)
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/google/login")
async def google_login():
    # Placeholder for OAuth implementation
    return {"message": "Google OAuth not yet implemented"}

@router.get("/google/callback")
async def google_callback(code: str, state: str):
    # Placeholder for OAuth implementation
    return {"message": "Google OAuth callback not yet implemented"}

@router.get("/github/login")
async def github_login():
    # Placeholder for OAuth implementation
    return {"message": "GitHub OAuth not yet implemented"}

@router.get("/github/callback")
async def github_callback(code: str, state: str):
    # Placeholder for OAuth implementation
    return {"message": "GitHub OAuth callback not yet implemented"}
