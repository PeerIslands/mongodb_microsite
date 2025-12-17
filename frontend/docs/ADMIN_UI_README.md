# Admin UI - Case Study Manager

## 🎨 Overview

A beautiful admin interface for managing case studies, built to match your existing homepage design system.

## 🚀 Access the Admin

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to admin:**
   ```
   http://localhost:5173/admin
   ```

## ✨ Features

### 📊 Dashboard (List View)
- **Stats Overview**: Total case studies, published count, featured count, total views
- **Table View**: All case studies with:
  - Title (with featured badge)
  - Industry
  - Tech Stack (as tags)
  - Migration Type
  - Status (Published/Draft - clickable toggle)
  - Created Date
  - View Count
  - Actions (Edit, Delete)
- **Add New Button**: Opens the form to create a new case study

### 📝 Case Study Form
6 comprehensive sections matching your requirements:

#### **Section 1: Basic Information**
- Title *
- URL Slug *
- Industry (dropdown) *
- Migration Type (dropdown) *
- Tech Stack (multi-select checkboxes) *
- Featured toggle
- Published toggle

#### **Section 2: Client Background**
- Company Name *
- Company Logo * (Image upload: PNG/JPG/SVG, max 2MB)
- Description * (Textarea with character count)
- Industry Details (Rich text)

#### **Section 3: Problem Statement**
- Challenges * (Dynamic list - add/remove items)
- Business Impact * (Textarea)
- Technical Constraints (Textarea)

#### **Section 4: Solution & Architecture**
- Solution Approach * (Textarea)
- Architecture Diagram * (Image upload: PNG/JPG, max 5MB)
- Implementation Details * (Textarea)
- Code Snippets (Optional dynamic list)

#### **Section 5: Value Delivered**
- Metrics * (Label + Value pairs, add/remove)
- Business Outcomes * (Dynamic list)
- Testimonial Quote (Optional)
- Testimonial Author (Optional)
- Author Position (Optional)

#### **Section 6: Media & Files**
- Hero Image * (PNG/JPG, max 5MB)
- Gallery Images (Multiple upload, max 8 images, 3MB each)
- Case Study PDF * (PDF only, max 10MB)

### 📤 File Upload Component
- **Drag & Drop**: Drop files or click to browse
- **Preview**: Image preview before/after upload
- **Progress**: Upload progress indicator
- **Validation**: Client-side validation for file type and size
- **Change/Remove**: Easy file management

## 🎨 Design System

### Colors
- Background: `#0a0a0a` (Dark)
- Primary Blue: `#5b6cff` (Buttons, accents)
- Success Green: `#00ff88`
- Error Red: `#ff5252`
- Text: White with various opacity levels

### Typography
- Headings: `Manrope` (300-600 weight)
- Body: `Inter` (400-600 weight)

### UI Elements
- Border Radius: 10px-30px (cards), 64px (buttons)
- Gradients: Subtle blue gradients on cards
- Glass Effect: `rgba(255, 255, 255, 0.05)` backgrounds
- Borders: `rgba(255, 255, 255, 0.1)` subtle borders

## 🔧 Components Structure

```
/pages
  ├── AdminDashboard.tsx      # Main admin page with routing logic
  └── AdminDashboard.css

/components/admin
  ├── AdminLayout.tsx          # Header + Layout wrapper
  ├── AdminLayout.css
  ├── CaseStudyList.tsx        # Table view with stats
  ├── CaseStudyList.css
  ├── CaseStudyForm.tsx        # Complete form (add/edit)
  ├── CaseStudyForm.css
  ├── FileUpload.tsx           # Reusable file uploader
  └── FileUpload.css

/src
  └── AppRoutes.tsx            # Simple routing logic
```

## 💡 Usage

### View All Case Studies
- Navigate to `/admin`
- See stats cards at the top
- Browse all case studies in the table
- Click status badge to toggle Published/Draft
- Use Edit/Delete action buttons

### Add New Case Study
1. Click "Add New Case Study" button
2. Fill all required fields (marked with *)
3. Upload images (company logo, architecture diagram, hero image)
4. Upload case study PDF
5. Add dynamic fields (challenges, metrics, outcomes)
6. Click "Create Case Study"

### Edit Case Study
1. Click edit button (✏️) on any case study
2. Form loads with existing data
3. Modify any fields
4. Click "Update Case Study"

### Delete Case Study
1. Click delete button (🗑️)
2. Confirm deletion
3. Case study removed

## 📱 Responsive Design

- **Desktop** (1200px+): Full layout with side-by-side grids
- **Tablet** (768px-1200px): Adjusted spacing and columns
- **Mobile** (<768px): Single column, stacked layout

## 🔄 State Management

Currently uses React `useState` for local state. Mock data is included for demonstration.

### Next Steps (When Connecting to API):
1. Replace mock data with API calls
2. Add loading states
3. Add error handling
4. Implement actual file upload to server/S3
5. Add success/error notifications

## 🎯 File Upload Integration

The `FileUpload` component includes commented code for production API integration:

```typescript
// Production upload example (currently commented):
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/v1/admin/upload', {
  method: 'POST',
  body: formData
});
const data = await response.json();
onUpload(data.url);
```

## 🚧 TODO (Future Enhancements)

- [ ] Add React Router for proper routing
- [ ] Connect to backend API
- [ ] Add authentication guard
- [ ] Implement search/filter in table
- [ ] Add pagination
- [ ] Add bulk actions
- [ ] Add image cropping tool
- [ ] Add rich text editor for detailed fields
- [ ] Add analytics dashboard
- [ ] Add export functionality

## 🎉 Complete Feature List

✅ Beautiful UI matching homepage design  
✅ Stats dashboard with metrics  
✅ Table view with all case studies  
✅ Add/Edit form with 6 sections  
✅ File upload with drag & drop  
✅ Image preview  
✅ Dynamic form fields (add/remove)  
✅ Metrics builder  
✅ Character count on textareas  
✅ Form validation  
✅ Responsive design  
✅ Status toggle  
✅ Featured badge  
✅ Tech stack tags  
✅ Action buttons  
✅ Mock data for testing  

---

**Ready to use!** Just navigate to `/admin` and start managing case studies. 🚀

