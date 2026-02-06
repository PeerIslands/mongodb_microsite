"""
Chatbot Service - AI-powered chatbot using Adaptive RAG (Retrieval Augmented Generation)

Architecture:
- Tier 1 (70%): Intent-based retrieval (single category, ~4K tokens)
- Tier 2 (27%): Broad search (all categories, ~13K tokens)
- Tier 3 (3%): Deep search with expansion (all categories, ~25-40K tokens)
"""

from typing import List, Dict, Any, Optional, Tuple
from openai import AzureOpenAI
from app.core.config import get_settings
from app.api.v1.repositories.case_study_repository import CaseStudyRepository
from app.api.v1.repositories.accelerator_repository import AcceleratorRepository
from app.api.v1.repositories.event_repository import EventRepository
from app.api.v1.repositories.blog_repository import BlogRepository
from app.api.v1.repositories.email_template_repository import EmailTemplateRepository

settings = get_settings()


class ChatbotService:
    """Service for AI-powered chatbot with adaptive RAG capabilities."""
    
    def __init__(self, db):
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_version=settings.AZURE_OPENAI_API_VERSION,
        )
        self.model = settings.AZURE_OPENAI_DEPLOYMENT_NAME
        
        # Initialize repositories
        self.case_study_repo = CaseStudyRepository(db)
        self.accelerator_repo = AcceleratorRepository(db)
        self.event_repo = EventRepository(db)
        self.blog_repo = BlogRepository(db)
        self.email_template_repo = EmailTemplateRepository(db)
    
    def detect_intent_with_confidence(self, question: str) -> Tuple[List[str], float]:
        """
        Detect question intent and return categories with confidence score.
        
        Returns:
            (categories, confidence_score)
            confidence_score: 0.0 (ambiguous) to 1.0 (very clear)
        """
        
        question_lower = question.lower()
        matches = {}
        
        # Define keywords per category
        accelerator_keywords = [
            'accelerator', 'tool', 'toolkit', 'plugin', 'migration', 'framework',
            'migrator', 'optimizer', 'developer kit', 'sdk', 'api', 'utility'
        ]
        
        case_study_keywords = [
            'case study', 'success story', 'customer', 'client', 'company',
            'implementation', 'deployed', 'used mongodb', 'example', 'testimonial'
        ]
        
        event_keywords = [
            'event', 'webinar', 'conference', 'workshop', 'meetup',
            'when', 'upcoming', 'meeting', 'register', 'attend', 'schedule'
        ]
        
        blog_keywords = [
            'blog', 'article', 'insight', 'read', 'learn', 'post',
            'guide', 'tutorial', 'best practice', 'documentation'
        ]
        
        newsletter_keywords = [
            'newsletter', 'email', 'subscription', 'mailing list',
            'updates', 'digest', 'bulletin', 'template'
        ]
        
        # Count keyword matches per category
        matches['accelerators'] = sum(1 for kw in accelerator_keywords if kw in question_lower)
        matches['case_studies'] = sum(1 for kw in case_study_keywords if kw in question_lower)
        matches['events'] = sum(1 for kw in event_keywords if kw in question_lower)
        matches['blogs'] = sum(1 for kw in blog_keywords if kw in question_lower)
        matches['newsletters'] = sum(1 for kw in newsletter_keywords if kw in question_lower)
        
        # Calculate confidence
        total_matches = sum(matches.values())
        
        if total_matches == 0:
            # No matches → AMBIGUOUS → Use Tier 2
            return ['all'], 0.0
        
        if total_matches >= 3:
            # Strong signal → Clear intent → Use Tier 1
            top_category = max(matches, key=matches.get)
            return [top_category], 1.0
        
        if total_matches >= 1:
            # Weak signal → Moderate confidence
            categories = [cat for cat, count in matches.items() if count > 0]
            confidence = 0.5 + (total_matches * 0.15)
            return categories, min(confidence, 0.95)
        
        return ['all'], 0.0
    
    async def get_targeted_context(self, categories: List[str], limit: int = 30) -> Dict[str, Any]:
        """
        Retrieve data from specific categories only (Tier 1).
        
        Args:
            categories: List of category names to fetch
            limit: Number of items to fetch per category
        """
        context = {}
        
        for category in categories:
            if category == 'accelerators':
                items = await self.accelerator_repo.get_all(status="published", limit=limit)
                context['accelerators'] = items
            elif category == 'case_studies':
                items = await self.case_study_repo.get_all(status="published", limit=limit)
                context['case_studies'] = items
            elif category == 'events':
                items = await self.event_repo.get_all(status="published", limit=limit)
                context['events'] = items
            elif category == 'blogs':
                items = await self.blog_repo.get_all(status="published", limit=limit)
                context['blogs'] = items
            elif category == 'newsletters':
                items, _ = await self.email_template_repo.get_all_templates(limit=limit, status="active")
                context['newsletters'] = items
        
        return context
    
    async def get_broad_context(self, limit: int = 20) -> Dict[str, Any]:
        """
        Retrieve data from all categories (Tier 2 & 3).
        
        Args:
            limit: Number of items to fetch per category
        """
        
        # Fetch from all collections
        case_studies = await self.case_study_repo.get_all(status="published", limit=limit)
        accelerators = await self.accelerator_repo.get_all(status="published", limit=limit)
        events = await self.event_repo.get_all(status="published", limit=limit)
        blogs = await self.blog_repo.get_all(status="published", limit=limit)
        newsletters, _ = await self.email_template_repo.get_all_templates(limit=limit, status="active")
        
        return {
            "case_studies": case_studies,
            "accelerators": accelerators,
            "events": events,
            "blogs": blogs,
            "newsletters": newsletters
        }
    
    def _build_context_string(self, context_data: Dict[str, Any]) -> str:
        """Build a formatted context string for the LLM."""
        
        context_parts = []
        
        # Add case studies
        if context_data.get("case_studies"):
            context_parts.append("=== SUCCESS STORIES / CASE STUDIES ===")
            for cs in context_data["case_studies"]:
                context_parts.append(f"""
Title: {cs.get('title', 'N/A')}
Company: {cs.get('company_name', 'N/A')}
Industry: {cs.get('industry', 'N/A')}
Description: {cs.get('description', 'N/A')}
Tech Stack: {', '.join(cs.get('tech_stack', []))}
Challenges: {cs.get('challenges', 'N/A')}
Approach: {cs.get('approach', 'N/A')}
Business Outcomes: {cs.get('business_outcomes', 'N/A')}
---""")
        
        # Add accelerators
        if context_data.get("accelerators"):
            context_parts.append("\n=== ACCELERATORS (Tools & Programs) ===")
            for acc in context_data["accelerators"]:
                # Handle metrics properly
                metrics = acc.get('metrics', [])
                if isinstance(metrics, list) and metrics:
                    metrics_str = ', '.join([f"{m.get('label', '')}: {m.get('value', '')}" for m in metrics if isinstance(m, dict)])
                else:
                    metrics_str = 'N/A'
                
                context_parts.append(f"""
Title: {acc.get('title', 'N/A')}
Subtitle: {acc.get('subtitle', 'N/A')}
Description: {acc.get('description', 'N/A')}
Key Metrics: {metrics_str}
Status: {acc.get('status', 'N/A')}
Featured: {'Yes' if acc.get('feature_on_homepage') else 'No'}
---""")
        
        # Add events
        if context_data.get("events"):
            context_parts.append("\n=== EVENTS ===")
            for event in context_data["events"]:
                context_parts.append(f"""
Title: {event.get('title', 'N/A')}
Subtitle: {event.get('subtitle', 'N/A')}
Date: {event.get('date', 'N/A')}
Time: {event.get('time', 'N/A')} {event.get('timezone', '')}
Duration: {event.get('duration_minutes', 'N/A')} minutes
Category: {event.get('category', 'N/A')}
Description: {event.get('description', 'N/A')}
Attendee Value: {event.get('attendee_value', 'N/A')}
Featured: {'Yes' if event.get('featured') else 'No'}
---""")
        
        # Add blogs
        if context_data.get("blogs"):
            context_parts.append("\n=== INSIGHTS / BLOGS ===")
            for blog in context_data["blogs"]:
                tags = blog.get('tags', [])
                tags_str = ', '.join(tags) if isinstance(tags, list) else str(tags)
                context_parts.append(f"""
Title: {blog.get('title', 'N/A')}
Category: {blog.get('category', 'N/A')}
Author: {blog.get('author', 'N/A')}
Description: {blog.get('description', 'N/A')}
Tags: {tags_str}
Published Date: {blog.get('published_date', 'N/A')}
URL: {blog.get('url', 'N/A')}
---""")
        
        # Add newsletters
        if context_data.get("newsletters"):
            context_parts.append("\n=== NEWSLETTERS / EMAIL TEMPLATES ===")
            for newsletter in context_data["newsletters"]:
                context_parts.append(f"""
Name: {newsletter.get('name', 'N/A')}
Slug: {newsletter.get('slug', 'N/A')}
Category: {newsletter.get('category', 'N/A')}
Description: {newsletter.get('description', 'N/A')}
Subject: {newsletter.get('subject', 'N/A')}
Status: {newsletter.get('status', 'N/A')}
Send Count: {newsletter.get('send_count', 0)}
Last Sent: {newsletter.get('last_sent_at', 'Never')}
---""")
        
        return "\n".join(context_parts)
    
    async def chat(
        self, 
        user_question: str, 
        search_depth: int = 20,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Process user question and generate AI response using adaptive RAG.
        
        Args:
            user_question: The user's question
            search_depth: Search depth (20=Tier2, 40=Tier3, 100+=Max)
            conversation_history: Previous messages (optional)
            
        Returns:
            Dictionary with response and metadata
        """
        
        try:
            # Step 1: Detect intent and choose strategy
            categories, confidence = self.detect_intent_with_confidence(user_question)
            
            # Step 2: Choose retrieval strategy based on confidence
            if confidence >= 0.7 and 'all' not in categories:
                # TIER 1: High confidence, specific categories
                tier = "tier1"
                context_data = await self.get_targeted_context(categories, limit=30)
            elif confidence >= 0.3 and 'all' not in categories:
                # TIER 1.5: Medium confidence, multiple categories
                tier = "tier1"
                context_data = await self.get_targeted_context(categories, limit=25)
            else:
                # TIER 2/3: Low confidence or explicit depth request, search everything
                tier = "tier2" if search_depth <= 20 else "tier3"
                context_data = await self.get_broad_context(limit=search_depth)
            
            # Check if we got any data
            total_items = sum(len(v) for v in context_data.values() if isinstance(v, list))
            if total_items == 0:
                return {
                    "response": "I don't have any published content available at the moment. Please check back later or contact support for assistance.",
                    "success": True,
                    "tier_used": tier,
                    "confidence": confidence,
                    "categories_searched": categories,
                    "suggest_expand": False
                }
            
            # Step 3: Build context string
            context_string = self._build_context_string(context_data)
            
            # Step 4: Build conversation messages
            messages = [
                {
                    "role": "system",
                    "content": f"""You are a helpful AI assistant for the MongoDB and PeerAI microsite. 
You help users find information about:
- Success stories and case studies (customer implementations)
- Accelerators (tools, programs, and frameworks)
- Events and webinars (conferences, workshops)
- Blogs and insights (articles, guides, best practices)
- Newsletters and email updates (subscription information, templates)
- General MongoDB and PeerAI offerings

IMPORTANT INSTRUCTIONS:
- Answer questions ONLY based on the context provided below
- If the context doesn't contain the answer, say "I don't have specific information about that in my current data"
- Be conversational, helpful, and concise
- Use bullet points and formatting for readability
- If you mention specific items (case studies, accelerators), include their names
- Don't make up information or hallucinate details

CONTEXT DATA:
{context_string}
"""
                }
            ]
            
            # Add conversation history if provided (keep last 8 messages)
            if conversation_history:
                messages.extend(conversation_history[-8:])
            
            # Add current user question
            messages.append({
                "role": "user",
                "content": user_question
            })
            
            # Step 5: Call Azure OpenAI
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )
            
            assistant_message = response.choices[0].message.content
            
            # Step 6: Return response with metadata
            return {
                "response": assistant_message,
                "success": True,
                "tier_used": tier,
                "confidence": confidence,
                "categories_searched": categories,
                "suggest_expand": tier == "tier2" and search_depth <= 20  # Suggest expansion only for initial Tier 2
            }
            
        except Exception as e:
            # Fallback error handling
            return {
                "response": "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
                "success": False,
                "error": str(e),
                "tier_used": "error",
                "confidence": 0.0,
                "categories_searched": [],
                "suggest_expand": False
            }

