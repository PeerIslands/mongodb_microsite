"""
Migration Script: Import Existing Newsletter into Email Templates

This script imports the existing newsletter HTML file into the email
templates database with embedded base64 images.
"""
import asyncio
import sys
import base64
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import Database
from app.api.v1.repositories.email_template_repository import EmailTemplateRepository


def get_image_mime_type(file_path: Path) -> str:
    """Get MIME type for image file"""
    mime_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
    }
    return mime_types.get(file_path.suffix.lower(), "image/png")


def image_to_base64(image_path: Path) -> str:
    """Convert image file to base64 data URI"""
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        base64_data = base64.b64encode(image_data).decode('utf-8')
        mime_type = get_image_mime_type(image_path)
        data_uri = f"data:{mime_type};base64,{base64_data}"
        
        return data_uri
    except Exception as e:
        print(f"   ❌ Error encoding {image_path.name}: {e}")
        return None


def embed_images_in_html(html_content: str, base_image_path: Path) -> tuple:
    """Embed all local images as base64 in HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    embedded_count = 0
    image_info = []
    
    for img in soup.find_all('img'):
        src = img.get('src', '')
        
        # Skip if already a data URI or external URL
        if src.startswith('data:') or src.startswith(('http://', 'https://')):
            continue
        
        # Find local image file
        local_image_path = base_image_path / src
        
        if not local_image_path.exists():
            print(f"   ⚠️  Image not found: {src}")
            continue
        
        # Convert to base64
        print(f"   🔄 Embedding: {local_image_path.name} ({local_image_path.stat().st_size / 1024:.1f} KB)")
        data_uri = image_to_base64(local_image_path)
        
        if data_uri:
            img['src'] = data_uri
            embedded_count += 1
            
            image_info.append({
                'filename': local_image_path.name,
                'original_path': src,
                'url': data_uri[:50] + '...',  # Store truncated for reference
                'alt_text': img.get('alt', ''),
                'size_bytes': local_image_path.stat().st_size
            })
            
            print(f"   ✅ Embedded: {local_image_path.name}")
    
    return str(soup), embedded_count, image_info


async def migrate_newsletter():
    """Main migration function"""
    
    print("=" * 80)
    print("📧 Newsletter Migration to Email Templates")
    print("=" * 80)
    print()
    
    # Initialize database
    print("⚙️  Connecting to database...")
    try:
        await Database.connect()
        db = Database.get_db()
        print("✅ Database connected")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return
    
    # Initialize repository
    repo = EmailTemplateRepository(db)
    
    # Check if newsletter already exists
    existing = await repo.get_template_by_slug("peerislands-delivers-big-in-2025")
    if existing:
        print("⚠️  Newsletter template already exists!")
        print(f"   ID: {existing['_id']}")
        print(f"   Name: {existing['name']}")
        print(f"   Created: {existing['created_at']}")
        print()
        response = input("Do you want to update it? (y/N): ")
        if response.lower() != 'y':
            print("❌ Migration cancelled")
            await Database.disconnect()
            return
        
        is_update = True
        template_id = existing['_id']
    else:
        is_update = False
    
    # Read newsletter HTML
    newsletter_path = Path(__file__).parent.parent.parent / "frontend" / "Newsletter-template" / "newsletter-peerislands-2025.html"
    
    if not newsletter_path.exists():
        print(f"❌ Newsletter HTML not found at: {newsletter_path}")
        await Database.disconnect()
        return
    
    print()
    print("📖 Reading newsletter HTML...")
    with open(newsletter_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    print("✅ Newsletter HTML loaded")
    print()
    
    # Embed images
    print("🖼️  Embedding images as base64 in HTML...")
    base_image_path = newsletter_path.parent
    
    updated_html, embedded_count, image_info = embed_images_in_html(html_content, base_image_path)
    
    print()
    print(f"📊 Images embedded: {embedded_count}")
    print()
    
    # Generate plain text version
    print("📝 Generating plain text version...")
    soup = BeautifulSoup(updated_html, 'html.parser')
    plain_text = soup.get_text(separator='\n', strip=True)
    print("✅ Plain text generated")
    print()
    
    # Create template data
    template_data = {
        'name': 'PeerIslands Delivers Big in 2025',
        'slug': 'peerislands-delivers-big-in-2025',
        'description': 'Newsletter showcasing PeerIslands MongoDB success stories and innovations in 2025',
        'category': 'newsletter',
        'status': 'active',
        'subject': 'PeerIslands Delivers Big in 2025 - Newsletter',
        'html_content': updated_html,
        'plain_text_content': plain_text,
        'variables': [],
        'images': image_info,
        'sendgrid_template_id': None,
        'sendgrid_version_id': None,
        'created_by': 'migration-script',
    }
    
    if is_update:
        # Update existing template
        print(f"🔄 Updating existing template: {template_id}...")
        success = await repo.update_template(template_id, template_data)
        
        if success:
            print()
            print("=" * 80)
            print("🎉 SUCCESS! Newsletter Template Updated!")
            print("=" * 80)
            print()
            print(f"✅ Template ID: {template_id}")
            print(f"✅ Name: {template_data['name']}")
            print(f"✅ Images embedded: {embedded_count}")
            print(f"✅ Status: {template_data['status']}")
            print()
        else:
            print("❌ Failed to update template")
    else:
        # Create new template
        print("💾 Saving to database...")
        template_id = await repo.create_template(template_data)
        
        print()
        print("=" * 80)
        print("🎉 SUCCESS! Newsletter Template Created!")
        print("=" * 80)
        print()
        print(f"✅ Template ID: {template_id}")
        print(f"✅ Name: {template_data['name']}")
        print(f"✅ Slug: {template_data['slug']}")
        print(f"✅ Category: {template_data['category']}")
        print(f"✅ Status: {template_data['status']}")
        print(f"✅ Images embedded: {embedded_count}")
        print()
        print("📧 Template is now available in the Email Templates admin panel!")
        print()
    
    print("=" * 80)
    
    # Disconnect from database
    await Database.disconnect()


def main():
    print()
    print("This script will import the existing newsletter HTML into the")
    print("email templates database with all images embedded as base64.")
    print()
    
    asyncio.run(migrate_newsletter())


if __name__ == "__main__":
    main()
