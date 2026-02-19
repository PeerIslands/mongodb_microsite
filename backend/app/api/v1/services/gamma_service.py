"""
Gamma Service - Generate professional presentations/documents using Gamma AI.
Gamma (gamma.app) creates beautiful, AI-powered presentations and documents.
"""

import httpx
from typing import Dict, Any, Optional
from app.core.config import get_settings

settings = get_settings()


class GammaService:
    """Service for generating presentations/documents using Gamma AI."""
    
    def __init__(self):
        self.api_key = settings.GAMMA_API_KEY
        self.base_url = "https://public-api.gamma.app/v1.0"
        
    async def generate_case_study_presentation(
        self,
        case_study_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a professional case study presentation using Gamma AI.
        
        Args:
            case_study_data: Dictionary containing case study information
            
        Returns:
            Dictionary with presentation URL and metadata
        """
        
        if not self.api_key:
            raise ValueError("Gamma API key not configured. Please set GAMMA_API_KEY in environment variables.")
        
        # Build the prompt for Gamma
        prompt = self._build_gamma_prompt(case_study_data)
        
        # Create the presentation via Gamma API
        async with httpx.AsyncClient(timeout=180.0) as client:
            try:
                # Gamma API endpoint for generating presentations
                print(f"Calling Gamma API to generate presentation...")
                print(f"Prompt length: {len(prompt)} characters")
                
                response = await client.post(
                    f"{self.base_url}/generations",
                    headers={
                        "X-API-KEY": self.api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "inputText": prompt,
                        "format": "presentation",
                        "textMode": "generate",
                        "numCards": 10,
                        "textOptions": {
                            "tone": "professional",
                            "audience": "executives"
                        },
                        "additionalInstructions": "Use PeerIslands branding with green (#00ED64, #00684A) colors. Include professional data visualizations for metrics. Make it suitable for enterprise C-level presentations. Generate relevant images for each slide."
                    }
                )
                
                response.raise_for_status()
                result = response.json()
                
                print(f"Gamma API response: {result}")
                
                # Gamma returns a generation object with 'generationId' (not 'id')
                generation_id = result.get("generationId")
                web_url = result.get("webUrl")
                
                # Poll for completion if needed
                if generation_id:
                    print(f"Generation ID: {generation_id}, polling for completion...")
                    final_result = await self._wait_for_completion(client, generation_id)
                    
                    print(f"Final Gamma result: {final_result}")
                    
                    # Extract URLs from final result
                    presentation_url = final_result.get("gammaUrl") or final_result.get("webUrl") or web_url
                    pdf_url = final_result.get("pdfUrl") or final_result.get("exportUrl") or final_result.get("pdfExportUrl")
                    
                    # Gamma doesn't return a separate PDF URL - use the presentation URL
                    # Users can export to PDF from the Gamma presentation page
                    if not pdf_url and presentation_url:
                        pdf_url = presentation_url
                    
                    print(f"Presentation URL: {presentation_url}")
                    print(f"PDF URL: {pdf_url}")
                    
                    return {
                        "success": True,
                        "presentation_url": presentation_url,
                        "presentation_id": generation_id,
                        "pdf_url": pdf_url,
                        "message": "Presentation generated successfully with Gamma AI"
                    }
                else:
                    raise ValueError(f"No generation ID returned from Gamma API. Response: {result}")
                
            except httpx.HTTPStatusError as e:
                error_text = e.response.text if hasattr(e.response, 'text') else str(e)
                print(f"Gamma API HTTP error: {error_text}")
                try:
                    error_detail = e.response.json()
                except:
                    error_detail = error_text
                raise ValueError(f"Gamma API error: {error_detail}")
            except Exception as e:
                print(f"Gamma service error: {str(e)}")
                raise ValueError(f"Error generating presentation with Gamma: {str(e)}")
    
    async def _wait_for_completion(
        self,
        client: httpx.AsyncClient,
        generation_id: str,
        max_attempts: int = 30
    ) -> Dict[str, Any]:
        """
        Wait for Gamma presentation generation to complete.
        
        Args:
            client: HTTP client instance
            generation_id: ID of the generation
            max_attempts: Maximum polling attempts
            
        Returns:
            Final generation result
        """
        import asyncio
        
        for attempt in range(max_attempts):
            try:
                print(f"Polling attempt {attempt + 1}/{max_attempts}...")
                
                response = await client.get(
                    f"{self.base_url}/generations/{generation_id}",
                    headers={
                        "X-API-KEY": self.api_key
                    }
                )
                
                response.raise_for_status()
                result = response.json()
                
                status = result.get("status")
                print(f"Status: {status}")
                
                if status == "completed":
                    print(f"✅ Generation completed! Result: {result}")
                    return result
                elif status == "failed":
                    error_msg = result.get("error", "Generation failed")
                    raise ValueError(f"Gamma generation failed: {error_msg}")
                else:
                    # Still processing, wait and retry
                    print(f"Still processing, waiting 3 seconds...")
                    await asyncio.sleep(3)  # Wait 3 seconds between checks
                    
            except httpx.HTTPStatusError as e:
                print(f"HTTP error during polling: {e.response.text}")
                if attempt == max_attempts - 1:
                    raise
                await asyncio.sleep(3)
            except Exception as e:
                print(f"Error during polling: {str(e)}")
                if attempt == max_attempts - 1:
                    raise
                await asyncio.sleep(3)
        
        raise ValueError("Gamma generation timed out after 90 seconds")
    
    def _build_gamma_prompt(self, case_study_data: Dict[str, Any]) -> str:
        """
        Build a comprehensive prompt for Gamma to generate a professional case study presentation.
        
        Gamma's AI will use this prompt to create slides with appropriate layouts, images, and styling.
        """
        
        title = case_study_data.get('title', 'Case Study')
        company_name = case_study_data.get('companyName', 'Client')
        industry = case_study_data.get('industry', '')
        description = case_study_data.get('description', '')
        tech_stack = case_study_data.get('techStack', [])
        migration_type = case_study_data.get('migrationType', '')
        challenges = case_study_data.get('challenges', '')
        approach = case_study_data.get('approach', '')
        metrics = case_study_data.get('metrics', [])
        business_outcomes = case_study_data.get('businessOutcomes', '')
        testimonial_quote = case_study_data.get('testimonialQuote', '')
        testimonial_author = case_study_data.get('testimonialAuthor', '')
        testimonial_position = case_study_data.get('testimonialPosition', '')
        
        # Format metrics for display
        metrics_text = ""
        if metrics:
            metrics_text = "\n".join([f"- {m.get('label', '')}: {m.get('value', '')}" for m in metrics])
        
        # Build the Gamma prompt
        prompt = f"""
Create a professional, visually stunning case study presentation for {company_name} in the {industry} industry.

**PRESENTATION REQUIREMENTS:**

**Brand Identity:**
- Use PeerIslands branding with green (#00ED64, #00684A) as primary colors
- Professional, modern, corporate aesthetic
- Include PeerIslands logo on title slide

**Slide Structure:**

SLIDE 1 - Title Slide:
Title: {title}
Subtitle: {company_name} | {industry}
Include: Modern, professional background with abstract tech elements

SLIDE 2 - Company Overview:
Title: About {company_name}
Content: {description}
Include: Company-related imagery or industry visualization

SLIDE 3 - Technologies Used:
Title: Technology Stack
Content: {', '.join(tech_stack) if tech_stack else 'MongoDB, Cloud Infrastructure, Modern Development Tools'}
{f"Migration Type: {migration_type}" if migration_type else ""}
Include: Technology logos or architecture diagram visualization

SLIDE 4 - The Challenge:
Title: Challenges & Pain Points
Content:
{challenges}
Include: Problem-focused imagery (concerned business people, complex systems, bottlenecks)

SLIDE 5 - Our Solution:
Title: Solution Approach
Content:
{approach}
Include: Solution-focused imagery (collaboration, modern architecture, innovation)

SLIDE 6 - Key Metrics & Results:
Title: Measurable Impact
Content:
{metrics_text if metrics_text else "Significant improvements across all key performance indicators"}
Include: Dashboard or metrics visualization with upward trending charts

SLIDE 7 - Business Outcomes:
Title: Business Value Delivered
Content:
{business_outcomes}
Include: Success imagery (growth charts, happy team, business success)

{"SLIDE 8 - Client Testimonial:" if testimonial_quote else ""}
{"Title: What Our Client Says" if testimonial_quote else ""}
{f'Quote: "{testimonial_quote}"' if testimonial_quote else ""}
{f"- {testimonial_author}, {testimonial_position}" if testimonial_author else ""}
{f"Include: Professional headshot placeholder or testimonial-style layout" if testimonial_quote else ""}

FINAL SLIDE - Call to Action:
Title: Partner with PeerIslands
Content: "Transform your data infrastructure with MongoDB and PeerIslands"
Contact: engage@peerislands.io | peerislands.io
Include: PeerIslands and MongoDB logos

**DESIGN INSTRUCTIONS:**
- Use professional, corporate design language
- Include AI-generated images that complement each slide's content
- Use data visualizations where metrics are mentioned
- Maintain consistent branding throughout
- Use modern, clean layouts with good use of white space
- Ensure text is readable and well-sized
- Use professional fonts (sans-serif, modern)
- Add subtle animations/transitions if appropriate
- Include contact information (engage@peerislands.io) prominently on the final slide

**IMAGE REQUIREMENTS:**
- Generate relevant, professional images for each slide
- Use abstract, modern, tech-focused imagery
- Incorporate green brand colors where possible
- Avoid generic stock photo look
- Make images complement and enhance the content

Create a presentation that would impress C-level executives and win enterprise deals.
"""
        
        return prompt.strip()
    
    async def export_to_pdf(self, presentation_id: str) -> bytes:
        """
        Export a Gamma presentation to PDF format.
        
        Args:
            presentation_id: The ID of the Gamma presentation
            
        Returns:
            PDF file content as bytes
        """
        
        if not self.api_key:
            raise ValueError("Gamma API key not configured.")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/generations/{presentation_id}/export/pdf",
                    headers={
                        "X-API-KEY": self.api_key
                    }
                )
                
                response.raise_for_status()
                return response.content
                
            except Exception as e:
                raise ValueError(f"Error exporting to PDF: {str(e)}")


# Singleton instance
_gamma_service: Optional[GammaService] = None


def get_gamma_service() -> GammaService:
    """Get or create the Gamma service instance."""
    global _gamma_service
    if _gamma_service is None:
        _gamma_service = GammaService()
    return _gamma_service
