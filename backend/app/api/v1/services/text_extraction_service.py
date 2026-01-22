"""
Text Extraction Service - Extract text from various file formats.
"""

import io
from typing import Optional
from fastapi import UploadFile
import PyPDF2
from pptx import Presentation
from docx import Document
from PIL import Image
import pytesseract


class TextExtractionService:
    """Service for extracting text from various file formats."""
    
    @staticmethod
    async def extract_text_from_file(file: UploadFile) -> str:
        """
        Extract text from uploaded file based on its type.
        
        Supported formats:
        - PDF: .pdf
        - PowerPoint: .ppt, .pptx
        - Word: .doc, .docx
        - Images: .jpg, .jpeg, .png, .gif, .bmp
        
        Args:
            file: The uploaded file
            
        Returns:
            Extracted text as string
            
        Raises:
            ValueError: If file format is not supported
        """
        content = await file.read()
        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''
        
        try:
            if file_extension == 'pdf':
                return TextExtractionService._extract_from_pdf(content)
            elif file_extension in ['ppt', 'pptx']:
                return TextExtractionService._extract_from_pptx(content)
            elif file_extension in ['doc', 'docx']:
                return TextExtractionService._extract_from_docx(content)
            elif file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp']:
                return TextExtractionService._extract_from_image(content)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
        except Exception as e:
            raise ValueError(f"Error extracting text from {file_extension}: {str(e)}")
    
    @staticmethod
    def _extract_from_pdf(content: bytes) -> str:
        """Extract text from PDF file with embedded text."""
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text_parts = []
        for page in pdf_reader.pages:
            text_parts.append(page.extract_text())
        
        return "\n\n".join(text_parts)
    
    @staticmethod
    def _extract_from_pptx(content: bytes) -> str:
        """Extract text from PowerPoint file."""
        pptx_file = io.BytesIO(content)
        presentation = Presentation(pptx_file)
        
        text_parts = []
        for slide in presentation.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text_parts.append(shape.text)
        
        return "\n\n".join(text_parts)
    
    @staticmethod
    def _extract_from_docx(content: bytes) -> str:
        """Extract text from Word document."""
        docx_file = io.BytesIO(content)
        doc = Document(docx_file)
        
        text_parts = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)
        
        return "\n\n".join(text_parts)
    
    @staticmethod
    def _extract_from_image(content: bytes) -> str:
        """Extract text from image using OCR."""
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
        return text.strip()


