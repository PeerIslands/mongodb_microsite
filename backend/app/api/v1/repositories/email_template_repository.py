"""
Email Template Repository

Handles database operations for email templates.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class EmailTemplateRepository:
    """Repository for email template data access"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """Initialize with database connection"""
        self.collection = db.email_templates
        logger.info("EmailTemplateRepository initialized")
    
    async def ensure_indexes(self):
        """Create indexes for optimized queries"""
        try:
            # Compound index for filtering and sorting
            await self.collection.create_index([
                ("category", 1),
                ("status", 1),
                ("created_at", -1)
            ], background=True)
            
            # Index for slug lookups
            await self.collection.create_index("slug", unique=True, background=True)
            
            # Index for created_at for sorting
            await self.collection.create_index([("created_at", -1)], background=True)
            
            logger.info("Email template indexes created successfully")
        except Exception as e:
            logger.warning(f"Index creation error (may already exist): {e}")
    
    async def create_template(self, template_data: Dict[str, Any]) -> str:
        """
        Create new email template.
        
        Args:
            template_data: Template data dict
        
        Returns:
            Inserted template ID as string
        """
        # Add timestamps and initial version
        template_data['created_at'] = datetime.utcnow()
        template_data['updated_at'] = datetime.utcnow()
        template_data['version'] = 1
        template_data['send_count'] = 0
        template_data['test_send_count'] = 0
        
        result = await self.collection.insert_one(template_data)
        logger.info(f"Created template: {result.inserted_id}")
        return str(result.inserted_id)
    
    async def get_template_by_id(self, template_id: str) -> Optional[Dict]:
        """
        Get template by ID.
        
        Args:
            template_id: Template ID string
        
        Returns:
            Template dict or None if not found
        """
        try:
            template = await self.collection.find_one({"_id": ObjectId(template_id)})
            if template:
                template['_id'] = str(template['_id'])
            return template
        except Exception as e:
            logger.error(f"Error getting template {template_id}: {e}")
            return None
    
    async def get_template_by_slug(self, slug: str) -> Optional[Dict]:
        """
        Get template by slug.
        
        Args:
            slug: Template slug
        
        Returns:
            Template dict or None if not found
        """
        template = await self.collection.find_one({"slug": slug})
        if template:
            template['_id'] = str(template['_id'])
        return template
    
    async def get_all_templates(
        self, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        status: Optional[str] = None,
        include_content: bool = False
    ) -> tuple[List[Dict], int]:
        """
        Get all templates with optional filtering.
        
        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            category: Filter by category (optional)
            status: Filter by status (optional)
            include_content: If True, includes html_content field (default: False)
        
        Returns:
            Tuple of (templates list, total count)
        """
        # Build filter
        filter_dict = {}
        if category:
            filter_dict['category'] = category
        if status:
            filter_dict['status'] = status
        
        # Get total count
        total = await self.collection.count_documents(filter_dict)
        
        # Projection to exclude large fields (html_content, images, plain_text_content)
        # This dramatically reduces payload size for list views
        # But include html_content if explicitly requested
        projection = {
            'images': 0,
            'plain_text_content': 0
        }
        if not include_content:
            projection['html_content'] = 0
        
        # Get templates with projection
        cursor = self.collection.find(filter_dict, projection).skip(skip).limit(limit).sort("created_at", -1)
        templates = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for template in templates:
            template['_id'] = str(template['_id'])
        
        return templates, total
    
    async def update_template(self, template_id: str, update_data: Dict) -> bool:
        """
        Update template.
        
        Args:
            template_id: Template ID string
            update_data: Fields to update
        
        Returns:
            True if updated, False otherwise
        """
        # Add updated timestamp and increment version
        update_data['updated_at'] = datetime.utcnow()
        
        result = await self.collection.update_one(
            {"_id": ObjectId(template_id)},
            {
                "$set": update_data,
                "$inc": {"version": 1}
            }
        )
        
        success = result.modified_count > 0
        if success:
            logger.info(f"Updated template: {template_id}")
        return success
    
    async def delete_template(self, template_id: str) -> bool:
        """
        Delete template.
        
        Args:
            template_id: Template ID string
        
        Returns:
            True if deleted, False otherwise
        """
        result = await self.collection.delete_one({"_id": ObjectId(template_id)})
        success = result.deleted_count > 0
        if success:
            logger.info(f"Deleted template: {template_id}")
        return success
    
    async def increment_send_count(self, template_id: str) -> bool:
        """
        Increment send count and update last_sent_at.
        
        Args:
            template_id: Template ID string
        
        Returns:
            True if updated
        """
        result = await self.collection.update_one(
            {"_id": ObjectId(template_id)},
            {
                "$inc": {"send_count": 1},
                "$set": {"last_sent_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    async def increment_test_send_count(self, template_id: str) -> bool:
        """
        Increment test send count.
        
        Args:
            template_id: Template ID string
        
        Returns:
            True if updated
        """
        result = await self.collection.update_one(
            {"_id": ObjectId(template_id)},
            {"$inc": {"test_send_count": 1}}
        )
        return result.modified_count > 0
    
    async def search_templates(self, search_query: str, limit: int = 20) -> List[Dict]:
        """
        Search templates by name or description.
        
        Args:
            search_query: Search query string
            limit: Maximum results
        
        Returns:
            List of matching templates
        """
        # Create text search filter
        filter_dict = {
            "$or": [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"description": {"$regex": search_query, "$options": "i"}},
                {"slug": {"$regex": search_query, "$options": "i"}}
            ]
        }
        
        cursor = self.collection.find(filter_dict).limit(limit).sort("created_at", -1)
        templates = await cursor.to_list(length=limit)
        
        for template in templates:
            template['_id'] = str(template['_id'])
        
        return templates
    
    async def get_templates_by_category(self, category: str) -> List[Dict]:
        """
        Get all templates in a specific category.
        
        Args:
            category: Category name
        
        Returns:
            List of templates
        """
        cursor = self.collection.find({"category": category}).sort("created_at", -1)
        templates = await cursor.to_list(length=None)
        
        for template in templates:
            template['_id'] = str(template['_id'])
        
        return templates
    
    async def get_active_templates(self) -> List[Dict]:
        """
        Get all active templates.
        
        Returns:
            List of active templates
        """
        cursor = self.collection.find({"status": "active"}).sort("created_at", -1)
        templates = await cursor.to_list(length=None)
        
        for template in templates:
            template['_id'] = str(template['_id'])
        
        return templates
