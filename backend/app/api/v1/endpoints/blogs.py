"""
Blog Endpoints - API endpoints for blog operations.

Endpoints:
- POST /blogs - Create a new blog
- GET /blogs - Get all blogs with filters
- GET /blogs/{blog_id} - Get a single blog by ID
- PUT /blogs/{blog_id} - Update a blog
- DELETE /blogs/{blog_id} - Delete a blog
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException

from app.api.v1.models.blog import (
    CreateBlogRequest,
    CreateBlogResponse,
    UpdateBlogRequest,
    UpdateBlogResponse,
    BlogResponse,
    BlogDetailResponse,
    DeleteBlogResponse,
    BlogStatus,
)
from app.api.v1.services.blog_service import BlogService
from app.api.v1.dependencies.services import get_blog_service
from app.api.v1.exceptions.blog_exceptions import (
    BlogNotFoundError,
    BlogAlreadyExistsError,
)

router = APIRouter(prefix="/blogs")


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "",
    response_model=CreateBlogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Blog",
    description="""
    Create a new blog post.
    
    **Required fields:**
    - `title`: Blog title
    - `description`: Blog description/content
    - `category`: Blog category
    - `url`: External blog URL
    
    **Optional fields:**
    - `author`: Author name
    - `published_date`: Publication date (YYYY-MM-DD)
    - `tags`: Array of tags
    - `status`: 'draft' or 'published' (default: draft)
    """,
    responses={
        201: {"description": "Blog created successfully"},
        409: {"description": "Blog with this URL already exists"},
        422: {"description": "Validation error"},
    },
)
async def create_blog(
    request: CreateBlogRequest,
    service: BlogService = Depends(get_blog_service),
) -> CreateBlogResponse:
    """Create a new blog post."""
    try:
        return await service.create_blog(request)
    except BlogAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.get(
    "",
    response_model=List[BlogResponse],
    summary="Get All Blogs",
    description="""
    Retrieve all blogs with optional filtering.
    
    **Filters:**
    - `category`: Filter by category
    - `status`: Filter by status ('published' or 'draft')
    
    **Returns:** List of blogs sorted by creation date (newest first).
    """,
)
async def get_all_blogs(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    status: Optional[str] = Query(default=None, description="Filter by status ('published' or 'draft')"),
    service: BlogService = Depends(get_blog_service),
) -> List[BlogResponse]:
    """Get all blogs with optional filters."""
    return await service.get_all_blogs(
        category=category,
        status=status,
    )


@router.get(
    "/categories",
    response_model=List[str],
    summary="Get All Categories",
    description="Get list of all unique blog categories.",
)
async def get_categories(
    service: BlogService = Depends(get_blog_service),
) -> List[str]:
    """Get all unique blog categories."""
    return await service.get_categories()


@router.get(
    "/{blog_id}",
    response_model=BlogDetailResponse,
    summary="Get Blog by ID",
    description="Retrieve a single blog by its unique ID.",
    responses={
        200: {"description": "Blog found"},
        404: {"description": "Blog not found"},
    },
)
async def get_blog_by_id(
    blog_id: str,
    service: BlogService = Depends(get_blog_service),
) -> BlogDetailResponse:
    """Get a single blog by its unique ID."""
    try:
        return await service.get_blog_by_id(blog_id)
    except BlogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.put(
    "/{blog_id}",
    response_model=UpdateBlogResponse,
    summary="Update Blog",
    description="""
    Update an existing blog.
    
    **All fields are optional** - only provided fields will be updated.
    """,
    responses={
        200: {"description": "Blog updated successfully"},
        404: {"description": "Blog not found"},
        422: {"description": "Validation error"},
    },
)
async def update_blog(
    blog_id: str,
    request: UpdateBlogRequest,
    service: BlogService = Depends(get_blog_service),
) -> UpdateBlogResponse:
    """Update an existing blog."""
    try:
        return await service.update_blog(blog_id, request)
    except BlogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.delete(
    "/{blog_id}",
    response_model=DeleteBlogResponse,
    summary="Delete Blog",
    description="Delete a blog by its unique ID.",
    responses={
        200: {"description": "Blog deleted successfully"},
        404: {"description": "Blog not found"},
    },
)
async def delete_blog(
    blog_id: str,
    service: BlogService = Depends(get_blog_service),
) -> DeleteBlogResponse:
    """Delete a blog by its unique ID."""
    try:
        return await service.delete_blog(blog_id)
    except BlogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )

