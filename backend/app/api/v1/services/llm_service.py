"""
LLM Service - Process extracted text with Azure OpenAI to generate case study data.
"""

import json
from typing import Dict, Any
from openai import AzureOpenAI
from app.core.config import get_settings

settings = get_settings()


class LLMService:
    """Service for processing text with Azure OpenAI LLM."""
    
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_version=settings.AZURE_OPENAI_API_VERSION,
        )
        self.model = settings.AZURE_OPENAI_DEPLOYMENT_NAME
    
    async def extract_case_study_data(self, text: str) -> Dict[str, Any]:
        """
        Process extracted text and generate structured case study data.
        
        Args:
            text: Extracted text from the document
            
        Returns:
            Dictionary with case study fields
        """
        
        prompt = self._build_extraction_prompt(text)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing case studies and extracting structured information. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            return self._normalize_result(result)
            
        except Exception as e:
            raise ValueError(f"Error processing with Azure OpenAI: {str(e)}")
    
    def _build_extraction_prompt(self, text: str) -> str:
        """Build the prompt for extracting a single case study from a document."""
        return f"""
Analyze this document and extract the case study information.

IMPORTANT INSTRUCTIONS:
- Extract all relevant information from the document
- If field names are not explicitly labeled, INFER them from context
- Look for patterns like: client stories, success stories, customer examples, implementation examples
- If no clear title exists, create a descriptive one based on the content (e.g., "Healthcare Provider Migration", "Retail Analytics Implementation")

Extract these fields:

**Basic Information:**
- title: Case study title or create a descriptive one (REQUIRED)
- companyName: Client/customer company name
- description: Brief company/project overview (2-3 sentences)
- industry: Industry sector (Healthcare, Finance, E-commerce, Retail, Manufacturing, Technology, Education, Government, Media, Telecommunications, Energy, Transportation, Real Estate, Insurance, Hospitality)
- techStack: Array of technologies mentioned (e.g., ["MongoDB", "Python", "AWS", "React"])
- migrationType: Type of migration if mentioned (e.g., "SQL to MongoDB", "Cloud Migration", "Legacy Modernization")

**Problem & Solution:**
- challenges: Problems or challenges the client faced (detailed paragraph)
- approach: Solution approach and implementation details (detailed paragraph)

**Results & Impact:**
- metrics: Array of 3-5 quantifiable results with label and value
  Example: [
    {{"label": "Performance Improvement", "value": "300%"}},
    {{"label": "Cost Reduction", "value": "50%"}},
    {{"label": "Time Savings", "value": "70%"}}
  ]
- businessOutcomes: Business outcomes and benefits achieved (detailed paragraph, separate multiple points with ' | ')

**Testimonials (if available):**
- testimonialQuote: Direct quote from client
- testimonialAuthor: Name of person giving testimonial
- testimonialPosition: Job title of testimonial author

RETURN FORMAT - MUST be valid JSON:
{{
  "title": "string",
  "companyName": "string",
  "description": "string",
  "industry": "string",
  "techStack": ["string"],
  "migrationType": "string",
  "challenges": "string",
  "approach": "string",
  "metrics": [{{"label": "string", "value": "string"}}],
  "businessOutcomes": "string",
  "testimonialQuote": "string",
  "testimonialAuthor": "string",
  "testimonialPosition": "string"
}}

If a field cannot be determined from the text, use:
- Empty string "" for text fields
- Empty array [] for array fields

Document text to analyze:
{text}

Remember: Return ONLY valid JSON. No additional text or explanations.
"""
    
    def _normalize_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize and validate the case study result."""
        normalized = {
            "title": result.get("title", "Untitled Case Study"),
            "companyName": result.get("companyName", ""),
            "description": result.get("description", ""),
            "industry": result.get("industry", ""),
            "techStack": result.get("techStack", []),
            "migrationType": result.get("migrationType", ""),
            "challenges": result.get("challenges", ""),
            "approach": result.get("approach", ""),
            "metrics": result.get("metrics", []),
            "businessOutcomes": result.get("businessOutcomes", ""),
            "testimonialQuote": result.get("testimonialQuote", ""),
            "testimonialAuthor": result.get("testimonialAuthor", ""),
            "testimonialPosition": result.get("testimonialPosition", "")
        }
        
        # Ensure title has a value
        if not normalized["title"] or normalized["title"].strip() == "":
            normalized["title"] = "Untitled Case Study"
        
        # Ensure techStack is an array
        if isinstance(normalized["techStack"], str):
            normalized["techStack"] = [normalized["techStack"]] if normalized["techStack"] else []
        
        # Ensure metrics is an array with proper structure
        if not isinstance(normalized["metrics"], list):
            normalized["metrics"] = []
        
        # Validate metrics structure
        validated_metrics = []
        for metric in normalized["metrics"][:5]:  # Max 5 metrics
            if isinstance(metric, dict) and "label" in metric and "value" in metric:
                validated_metrics.append({
                    "label": str(metric["label"]),
                    "value": str(metric["value"])
                })
        
        normalized["metrics"] = validated_metrics
        
        return normalized
