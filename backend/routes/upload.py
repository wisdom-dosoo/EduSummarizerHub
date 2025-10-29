from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from models import UploadResponse
from routes.auth import get_current_user
from models import User

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if not file.filename.endswith(('.txt', '.md')):
        raise HTTPException(status_code=400, detail="Only .txt and .md files are allowed")

    content = await file.read()
    text_content = content.decode("utf-8")

    # Basic validation
    if len(text_content.strip()) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    return UploadResponse(
        filename=file.filename,
        content=text_content,
        file_size=len(content)
    )
