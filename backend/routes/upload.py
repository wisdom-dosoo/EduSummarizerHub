from fastapi import APIRouter, UploadFile, File, HTTPException
from models import UploadResponse
import logging

router = APIRouter(prefix="/upload", tags=["Upload"])
logger = logging.getLogger(__name__)

@router.post("/", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file type
        allowed_extensions = ['.txt', '.md', '.docx', '.pdf', '.csv', '.xlsx']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            logger.warning(f"Invalid file type attempted: {file.filename}")
            raise HTTPException(status_code=400, detail=f"Only {', '.join(allowed_extensions)} files are allowed")

        # Read file content
        content = await file.read()
        text_content = content.decode("utf-8")

        # Basic validation
        if len(text_content.strip()) == 0:
            logger.warning(f"Empty file uploaded: {file.filename}")
            raise HTTPException(status_code=400, detail="File is empty")

        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(content) > max_size:
            logger.warning(f"File too large: {file.filename} ({len(content)} bytes)")
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

        logger.info(f"File uploaded successfully: {file.filename} ({len(content)} bytes)")
        return UploadResponse(
            filename=file.filename,
            content=text_content,
            file_size=len(content)
        )
    except UnicodeDecodeError:
        logger.error(f"Encoding error for file: {file.filename}")
        raise HTTPException(status_code=400, detail="File encoding not supported. Please use UTF-8 encoded text files.")
    except Exception as e:
        logger.error(f"Unexpected error during file upload: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during file processing")
