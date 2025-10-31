from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
import os

load_dotenv()

app = FastAPI(title="EduSummarizer Hub API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize cache
@ app.on_event("startup")
async def startup():
    try:
        redis = aioredis.from_url("redis://localhost", encoding="utf8", decode_responses=True)
        FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    except Exception as e:
        print(f"Redis not available, running without cache: {e}")
        # Continue without cache if Redis is not available

# Include routers
from routes import upload, summarize, translate, quiz
app.include_router(upload.router)
app.include_router(summarize.router)
app.include_router(translate.router)
app.include_router(quiz.router)


@app.get("/")
async def root():
    return {"message": "Welcome to EduSummarizer Hub API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
