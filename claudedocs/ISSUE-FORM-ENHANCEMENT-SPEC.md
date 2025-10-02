# Issue Form Enhancement - Category-Based Dynamic Inputs

**Date**: 2025-10-02
**Status**: Specification
**Purpose**: Improve issue reporting UX for non-technical users with structured category-specific inputs

## Problem Statement

Non-technical users struggle to provide complete information when reporting issues because:
- They don't know what details to include
- Free-form description fields are intimidating
- Important context (URLs, browsers, error messages) is often missing
- Technical terms like "reproducibility" and "severity" are confusing

## Solution Overview

**Dynamic Category-Based Form**:
1. User selects Issue Category (Website, Hosting, Email, Other)
2. Form dynamically shows category-specific input fields
3. On submit, fields are converted to formatted HTML and saved as description
4. Maintains existing MantisBT compatibility

## User Experience Flow

```
1. User lands on /issues/new
2. Sees general helper card with basic tips
3. Selects Issue Category from dropdown
4. Form reveals category-specific fields
5. Fills in structured inputs (text fields, not WYSIWYG)
6. Clicks "Create Issue"
7. System generates HTML description from inputs
8. Issue created with formatted description
```

## Design Specifications

### General Helper Card (Always Visible)

**Position**: Above the form
**Content**:
```
┌─────────────────────────────────────────────────────────┐
│ 📝 Help Us Fix This Faster                             │
│                                                         │
│ Please provide as much detail as possible:             │
│ ✅ What's affected (page, service, email, etc.)        │
│ ✅ Screenshots (paste directly into any text field)    │
│ ✅ What you were trying to do                          │
│ ✅ What happened instead                               │
│ ✅ When it started                                     │
│                                                         │
│ 💡 Tip: Press Ctrl+V to paste screenshots              │
└─────────────────────────────────────────────────────────┘
```

**Styling**: Light blue background (`bg-blue-50 dark:bg-blue-900/20`), rounded border, icon

### Issue Category Field

**Position**: After "Project" field, before existing fields
**Type**: Dropdown select
**Options**:
- `""` (empty/default) - "Select Category"
- `"website"` - "Website Issue"
- `"hosting"` - "Hosting Issue"
- `"email"` - "Email Issue"
- `"other"` - "Other"

**Behavior**:
- Required field
- When changed, show/hide category-specific fields
- Reset category fields when category changes

### Category-Specific Fields

#### **Website Issue** (`category: "website"`)

**Fields**:
1. **Page URL** (text input, required)
   - Label: "Which page has the problem?"
   - Placeholder: "https://example.com/page"

2. **Browser** (text input, required)
   - Label: "What browser are you using?"
   - Placeholder: "Chrome, Safari, Firefox, Edge, etc."

3. **What were you doing?** (WYSIWYG editor, required)
   - Label: "What were you trying to do?"
   - Placeholder: "e.g., Clicking the submit button, filling out a form..."
   - Users can paste screenshots directly

4. **What happened?** (WYSIWYG editor, required)
   - Label: "What happened instead?"
   - Placeholder: "e.g., Page froze, error message appeared, nothing happened..."
   - Users can paste screenshots directly

5. **Error message** (WYSIWYG editor, optional)
   - Label: "Any error messages? (if visible)"
   - Placeholder: "Copy and paste any error text here"
   - Users can paste screenshots directly

**Generated HTML Format**:
```html
<p><strong>Page URL:</strong> [value]</p>
<p><strong>Browser:</strong> [value]</p>
<p><strong>What I was doing:</strong></p>
<p>[value]</p>
<p><strong>What happened:</strong></p>
<p>[value]</p>
<p><strong>Error Message:</strong></p>
<p>[value or "None provided"]</p>
```

#### **Hosting Issue** (`category: "hosting"`)

**Fields**:
1. **Which service?** (select dropdown, required)
   - Label: "Which service is affected?"
   - Options: "Website", "Email", "Database", "FTP/File Access", "Other"

2. **What's the problem?** (WYSIWYG editor, required)
   - Label: "What's not working?"
   - Placeholder: "e.g., Website is down, can't connect to email, slow loading..."
   - Users can paste screenshots directly

3. **When did it start?** (text input, required)
   - Label: "When did this start?"
   - Placeholder: "e.g., Today at 2pm, This morning, Yesterday..."

4. **Error message** (WYSIWYG editor, optional)
   - Label: "Any error messages? (if visible)"
   - Placeholder: "Copy and paste any error text here"
   - Users can paste screenshots directly

**Generated HTML Format**:
```html
<p><strong>Service Affected:</strong> [value]</p>
<p><strong>Problem Description:</strong></p>
<p>[value]</p>
<p><strong>Started At:</strong> [value]</p>
<p><strong>Error Message:</strong></p>
<p>[value or "None provided"]</p>
```

#### **Email Issue** (`category: "email"`)

**Fields**:
1. **Email direction** (select dropdown, required)
   - Label: "Are you having trouble sending or receiving?"
   - Options: "Sending", "Receiving", "Both"

2. **Email client** (text input, required)
   - Label: "What email program/app are you using?"
   - Placeholder: "Gmail, Outlook, Apple Mail, Thunderbird, Phone app, etc."

3. **What's happening?** (WYSIWYG editor, required)
   - Label: "Describe the problem"
   - Placeholder: "e.g., Emails not arriving, can't send, getting bounced back..."
   - Users can paste screenshots directly

4. **Email addresses** (text input, optional)
   - Label: "Affected email addresses (if relevant)"
   - Placeholder: "you@example.com, recipient@example.com"

5. **Error message** (WYSIWYG editor, optional)
   - Label: "Any error messages? (if visible)"
   - Placeholder: "Copy and paste any error text here"
   - Users can paste screenshots directly

**Generated HTML Format**:
```html
<p><strong>Issue Type:</strong> [value]</p>
<p><strong>Email Client:</strong> [value]</p>
<p><strong>Problem Description:</strong></p>
<p>[value]</p>
<p><strong>Affected Addresses:</strong> [value or "Not specified"]</p>
<p><strong>Error Message:</strong></p>
<p>[value or "None provided"]</p>
```

#### **Other** (`category: "other"`)

**Fields**:
1. **Detailed description** (WYSIWYG editor, required)
   - Label: "Please describe the issue in detail"
   - Placeholder: "Include as much information as possible: what's affected, what you were doing, what happened, when it started, etc."
   - Users can paste screenshots directly

**Generated HTML Format**:
```html
<p><strong>Issue Description:</strong></p>
<p>[value]</p>
```

### Form Behavior

#### Field Visibility
- Category-specific fields only shown when category is selected
- Use `display: none` or conditional rendering in React
- Smooth transition when switching categories

#### Validation
- Category field: Required
- Category-specific required fields: Enforce validation
- Show validation errors inline
- Prevent submission if validation fails

#### Summary Field Enhancement
- Keep existing Summary field at top
- Consider pre-populating from category data (optional)
- Example: "Website Issue: Login page error" or "Email Issue: Cannot send emails"

### Technical Implementation

#### Component Structure

```typescript
// State management
const [category, setCategory] = useState<string>("");

// Category-specific field states
const [websiteFields, setWebsiteFields] = useState({
  pageUrl: "",
  browser: "",
  whatDoing: "",
  whatHappened: "",
  errorMessage: ""
});

const [hostingFields, setHostingFields] = useState({
  service: "",
  problem: "",
  startedAt: "",
  errorMessage: ""
});

const [emailFields, setEmailFields] = useState({
  direction: "",
  client: "",
  problem: "",
  addresses: "",
  errorMessage: ""
});

const [otherFields, setOtherFields] = useState({
  description: ""
});
```

#### HTML Generation Function

**Note**: Editor component values are already HTML (not plain text), so they can be inserted directly into the generated description. The TipTap Editor handles HTML sanitization automatically.

```typescript
function generateDescriptionHtml(category: string): string {
  switch (category) {
    case "website":
      return `
        <p><strong>Page URL:</strong> ${websiteFields.pageUrl}</p>
        <p><strong>Browser:</strong> ${websiteFields.browser}</p>
        <p><strong>What I was doing:</strong></p>
        ${websiteFields.whatDoing}
        <p><strong>What happened:</strong></p>
        ${websiteFields.whatHappened}
        <p><strong>Error Message:</strong></p>
        ${websiteFields.errorMessage || "<p>None provided</p>"}
      `.trim();

    case "hosting":
      return `
        <p><strong>Service Affected:</strong> ${hostingFields.service}</p>
        <p><strong>Problem Description:</strong></p>
        ${hostingFields.problem}
        <p><strong>Started At:</strong> ${hostingFields.startedAt}</p>
        <p><strong>Error Message:</strong></p>
        ${hostingFields.errorMessage || "<p>None provided</p>"}
      `.trim();

    case "email":
      return `
        <p><strong>Issue Type:</strong> ${emailFields.direction}</p>
        <p><strong>Email Client:</strong> ${emailFields.client}</p>
        <p><strong>Problem Description:</strong></p>
        ${emailFields.problem}
        <p><strong>Affected Addresses:</strong> ${emailFields.addresses || "Not specified"}</p>
        <p><strong>Error Message:</strong></p>
        ${emailFields.errorMessage || "<p>None provided</p>"}
      `.trim();

    case "other":
      return `
        <p><strong>Issue Description:</strong></p>
        ${otherFields.description}
      `.trim();

    default:
      return "";
  }
}
```

#### Submit Handler Update

```typescript
async function submit(e: React.FormEvent) {
  e.preventDefault();

  // Generate HTML description from category fields
  const generatedDescription = generateDescriptionHtml(category);

  await fetch("/api/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      summary,
      description: generatedDescription, // Use generated HTML
      status,
      priority,
      severity,
      reproducibility,
      handler_id: handlerId || null,
    }),
    cache: 'no-store'
  });

  window.location.href = "/issues";
}
```

### Modified Components

#### WYSIWYG Editor Usage
- Use `<Editor>` component for all multi-line text fields
- Each category-specific WYSIWYG field gets its own state
- Editor supports image pasting, formatting, and rich text
- Generated description combines all Editor HTML outputs

#### Keep Existing Fields
- Summary (required)
- Project (required)
- Status, Priority, Severity, Reproducibility (keep defaults)
- Assignee (optional)

### Styling Guidelines

**Helper Card**:
```tsx
<div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
  <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
    <span>📝</span> Help Us Fix This Faster
  </h3>
  {/* Content */}
</div>
```

**Category-Specific Sections**:
```tsx
{category === "website" && (
  <div className="space-y-3 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
    {/* Website-specific fields */}
  </div>
)}
```

**Field Styling** (consistent with existing form):
```tsx
{/* Text Input */}
<input
  className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
  // ...
/>

{/* WYSIWYG Editor for multi-line text */}
<Editor
  value={fieldValue}
  onChange={setFieldValue}
/>
```

## Implementation Checklist

- [ ] Add category state management
- [ ] Create helper card component
- [ ] Add Issue Category dropdown field
- [ ] Implement Website category fields with validation
- [ ] Implement Hosting category fields with validation
- [ ] Implement Email category fields with validation
- [ ] Implement Other category field with validation
- [ ] Create HTML generation function with proper escaping
- [ ] Update submit handler to use generated description
- [ ] Remove WYSIWYG Editor component
- [ ] Test category switching (field reset)
- [ ] Test HTML output formatting
- [ ] Test dark mode styling
- [ ] Test validation for all required fields
- [ ] Update documentation

## Testing Scenarios

### Functional Testing
1. **Category Selection**: Switch between categories, verify correct fields show/hide
2. **Field Validation**: Try submitting with missing required fields
3. **HTML Generation**: Verify generated HTML is properly formatted
4. **Category Reset**: Switch categories, verify previous fields are cleared
5. **Submit Flow**: Complete form → submit → verify issue created with correct description

### User Testing
1. **Non-technical user**: Can they complete the form without confusion?
2. **Field clarity**: Are labels and placeholders clear?
3. **Error messages**: Are validation errors helpful?
4. **Mobile usability**: Does it work well on phones/tablets?

### Edge Cases
1. **Special characters**: HTML entities properly escaped in generated description?
2. **Long text**: Textareas handle lengthy descriptions?
3. **Empty optional fields**: "None provided" displays correctly?
4. **Multiple line breaks**: Preserved in generated HTML?

## Future Enhancements (Optional)

1. **Category-based Summary suggestions**: Auto-suggest summary based on category
2. **Screenshot upload**: Add direct upload (not just in notes)
3. **Browser detection**: Auto-detect browser for Website issues
4. **Email validation**: Validate email addresses in Email issue type
5. **URL validation**: Verify URL format for Website issues
6. **Time picker**: Structured time input for "When did it start?"
7. **Template customization**: Admin can customize category fields
8. **Analytics**: Track which categories are most common

## Related Files

- `app/(dash)/issues/new/page.tsx` - Main form component (to be modified)
- `components/wysiwyg/Editor.tsx` - WYSIWYG editor (will be removed from this form)
- `app/api/issues/route.ts` - Issue creation API (no changes needed)
- `claudedocs/ISSUE-FORM-ENHANCEMENT-SPEC.md` - This specification

## References

- MantisBT issue creation flow
- TailAdmin form component patterns
- Existing NextBT dark mode styling system
