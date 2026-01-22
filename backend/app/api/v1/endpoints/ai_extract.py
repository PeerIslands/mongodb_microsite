"""
AI Extract Endpoints - Extract and process documents with AI.
"""

from typing import Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from pydantic import BaseModel

from app.api.v1.services.text_extraction_service import TextExtractionService
from app.api.v1.services.llm_service import LLMService


router = APIRouter(prefix="/ai-extract")


class ExtractResponse(BaseModel):
    """Response model for AI extraction."""
    success: bool
    data: Dict[str, Any]
    message: str


@router.post(
    "/case-study",
    response_model=ExtractResponse,
    summary="Extract Case Study Data from Document",
    description="""
    Upload a document (PDF, PPT, DOC, or Image) and extract case study information using AI.
    
    **Supported formats:**
    - PDF: .pdf
    - PowerPoint: .ppt, .pptx
    - Word: .doc, .docx
    - Images: .jpg, .jpeg, .png, .gif, .bmp
    
    **Returns:**
    Structured case study data that can be used to auto-fill the form.
    """,
)
async def extract_case_study_from_document(
    file: UploadFile = File(..., description="Document file to extract data from")
) -> ExtractResponse:
    """
    Extract case study data from uploaded document using AI.
    
    Steps:
    1. Extract text from the document (OCR)
    2. Process text with AI to structure data
    3. Return formatted case study fields
    """
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    file_extension = file.filename.split('.')[-1].lower()
    supported_extensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'bmp']
    
    if file_extension not in supported_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported: {', '.join(supported_extensions)}"
        )
    
    try:
        # Step 1: Extract text from document
        text_extractor = TextExtractionService()
        extracted_text = await text_extractor.extract_text_from_file(file)
        
        if not extracted_text or len(extracted_text.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract sufficient text from document. Please ensure the document contains readable text."
            )
        
        # Step 2: Process with AI
        llm_service = LLMService()
        case_study_data = await llm_service.extract_case_study_data(extracted_text)
        
        return ExtractResponse(
            success=True,
            data=case_study_data,
            message="Case study data extracted successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )
