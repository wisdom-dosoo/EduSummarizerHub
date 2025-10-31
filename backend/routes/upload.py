from fastapi import APIRouter, UploadFile, File, HTTPException
from models import UploadResponse

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("/", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.txt', '.md', '.docx', '.pdf', '.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only .txt, .md, .docx, .pdf, .csv, and .xlsx files are allowed")

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
