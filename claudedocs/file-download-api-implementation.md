# File Download API Implementation

## Overview

Implemented a Next.js API handler to replace MantisBT's PHP `file_download.php` functionality for serving bug attachments and project documents.

## Components Created

### 1. API Route Handler
**File**: `/app/api/files/[fileId]/route.ts`

**Features**:
- Authentication via session validation
- Support for bug attachments (`type=bug`) and project documents (`type=doc`)
- Access control based on user's project permissions
- MIME type detection and inline/attachment content disposition
- Support for database-stored and disk-stored files
- Security headers (X-Content-Type-Options, Content-Disposition)

**Query Parameters**:
- `type`: "bug" (default) or "doc"
- `show_inline`: "1" to display inline, "0" to force download

**Example URLs**:
```
/api/files/327?type=bug&show_inline=1
/api/files/123?type=doc&show_inline=0
```

### 2. URL Transformation Component
**File**: `/components/issues/HtmlContent.tsx`

**Enhancement**: Added automatic transformation of `file_download.php` URLs to Next.js API endpoints when rendering HTML content.

**How it works**:
```javascript
// Detects: file_download.php?file_id=327&type=bug
// Transforms to: /api/files/327?type=bug&show_inline=1
```

### 3. Utility Functions
**File**: `/lib/file-url-transform.ts`

**Functions**:
- `transformFileUrl(url, showInline)`: Transform single URL
- `transformHtmlFileUrls(html, showInline)`: Transform all URLs in HTML content

**Usage**:
```typescript
import { transformFileUrl } from "@/lib/file-url-transform";

const apiUrl = transformFileUrl("file_download.php?file_id=123&type=bug");
// Returns: "/api/files/123?type=bug&show_inline=1"
```

## Security Features

1. **Authentication**: Requires valid session cookie
2. **Access Control**: Validates user has access to the project containing the file
3. **MIME Type Restrictions**:
   - Forces inline display for safe types (images, PDFs)
   - Forces download for potentially dangerous types (HTML, SVG, Flash)
4. **Content-Type Sniffing Prevention**: X-Content-Type-Options: nosniff header
5. **Project-Based Permissions**: Checks `session.projects` array for authorization

## Database Schema

### Bug Attachments
**Table**: `mantis_bug_file_table`
```typescript
{
  id: number
  bug_id: number
  filename: string
  filesize: number
  file_type: string
  content: Buffer | null  // Database storage
  diskfile: string        // Disk storage path
  date_added: number      // Unix timestamp
  user_id: number
  bugnote_id: number | null
}
```

### Project Documents
**Table**: `mantis_project_file_table`
```typescript
{
  id: number
  project_id: number
  filename: string
  filesize: number
  file_type: string
  content: Buffer | null  // Database storage
  diskfile: string        // Disk storage path
  date_added: number      // Unix timestamp
  user_id: number
}
```

## File Storage Modes

The API supports both MantisBT storage methods:

1. **Database Storage** (`content` field):
   - Files stored as BLOB in database
   - Directly served from `content` field

2. **Disk Storage** (`diskfile` field):
   - Files stored in filesystem
   - Default path: `uploads/{project_id}/{diskfile}`
   - Read using Node.js `fs/promises`

## Testing Results

**Test Case**: Issue #266 with 3 image attachments (file IDs: 327, 395, 396)

**Results**:
- ✅ All images loaded successfully with 200 status codes
- ✅ URL transformation working automatically
- ✅ Session authentication verified
- ✅ Project access control enforced
- ✅ Files served with correct MIME types
- ✅ Inline display working (show_inline=1)

**Server Logs**:
```
GET /api/files/327?type=bug&show_inline=1 200 in 192ms
GET /api/files/396?type=bug&show_inline=1 200 in 129ms
GET /api/files/395?type=bug&show_inline=1 200 in 20ms
```

## Migration Notes

### Before (MantisBT PHP)
```html
<img src="file_download.php?type=bug&file_id=327">
```

### After (Next.js API)
```html
<img src="/api/files/327?type=bug&show_inline=1">
```

**Automatic Transformation**: The `HtmlContent` component automatically transforms old URLs when rendering legacy MantisBT content.

## Future Enhancements

1. **Caching**: Add Redis/memory cache for frequently accessed files
2. **Streaming**: Implement streaming for large files
3. **Range Requests**: Support partial content delivery (HTTP 206)
4. **CDN Integration**: Offload static file serving to CDN
5. **Thumbnail Generation**: Generate thumbnails for image attachments
6. **Virus Scanning**: Integrate antivirus scanning for uploaded files
7. **Rate Limiting**: Prevent abuse with download rate limits

## Configuration

No additional configuration required. The API uses existing:
- Session management from `/lib/auth.ts`
- Prisma database client from `/db/client.ts`
- MantisBT database schema

## Error Handling

**400 Bad Request**: Invalid file ID
**401 Unauthorized**: No valid session
**403 Forbidden**: User lacks project access
**404 Not Found**: File record not found
**500 Internal Server Error**: File read failure or other system errors

All errors logged to console with descriptive messages.