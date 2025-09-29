# 15 — UI/UX Design System

## Design Foundation

**Base Theme**: [TailAdmin Free Next.js Admin Dashboard](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
- Modern, clean admin interface with dark/light mode support
- Pre-built components: tables, forms, cards, charts, modals
- Responsive design with mobile-first approach
- Tailwind CSS utility-first styling

## Design Principles

1. **Simplicity Over Features** - Hide MantisBT complexity, show only what non-technical users need
2. **Progressive Disclosure** - Advanced features accessible but not cluttering main interface
3. **Familiar Patterns** - Use common bug tracking UI patterns (Jira-like, Linear-like)
4. **Accessibility First** - WCAG 2.1 AA compliance, keyboard navigation, screen reader support
5. **Performance** - Fast load times, optimistic UI updates, minimal JavaScript

## Layout Structure

### Main Dashboard (`(dash)/layout.tsx`)
```
┌─────────────────────────────────────────┐
│ Top Navigation Bar                       │
│ [Logo] [Search] [Notifications] [User]  │
├──────┬──────────────────────────────────┤
│      │                                   │
│ Side │  Main Content Area                │
│ bar  │  (Issues, Projects, etc.)         │
│      │                                   │
│ - Dash│                                  │
│ - Proj│                                  │
│ - Issu│                                  │
│ - Sear│                                  │
│ - Admi│                                  │
└──────┴──────────────────────────────────┘
```

### Sidebar Navigation
- **Dashboard** - Overview, recent activity, stats
- **Projects** - Project list with filtering
- **Issues** - Main issue board/list view
- **Search** - Advanced search interface
- **Admin** - Settings, notifications, permissions (for admins)

### Top Navigation
- **Global Search** - Quick issue/project search
- **Notifications Bell** - Unread notifications count
- **User Menu** - Profile, settings, logout

## Page Layouts

### Dashboard Home (`/`)
**Purpose**: Quick overview of user's active work

**Components**:
- **Stats Cards** (TailAdmin CardDataStats)
  - Total Issues Assigned
  - Issues Due This Week
  - Recently Updated
  - Open Issues by Project
- **Recent Activity Table** (TailAdmin TableThree)
  - Recent issue updates user has access to
  - Columns: ID, Title, Status, Project, Last Updated
- **Quick Actions**
  - New Issue button (primary CTA)
  - Recently Viewed Issues

### Projects List (`/projects`)
**Components**:
- **Project Cards Grid** (TailAdmin CardTwo style)
  - Project name, description excerpt
  - Issue count badges (Open/Closed)
  - Last activity timestamp
  - Quick access to project issues
- **Filter Bar**
  - Search by name
  - Filter by status (Active/Archived)
  - Sort options

### Issues List (`/issues`)
**Layout Options**:
1. **Table View** (Default - TailAdmin TableOne)
   - Columns: ID, Title, Status, Priority, Assignee, Updated
   - Sortable columns
   - Row actions: View, Edit, Quick Status Update

2. **Board View** (Kanban - Custom)
   - Swimlanes by status (New, In Progress, Resolved, Closed)
   - Drag-and-drop to update status
   - Card shows: ID, Title, Assignee avatar, Priority badge

**Filters & Actions**:
- **Quick Filters** (Chips/Badges)
  - My Issues
  - Unassigned
  - Due This Week
  - High Priority
- **Advanced Filters** (Collapsible Panel)
  - Project, Category, Status, Priority, Assignee
  - Date ranges (created, updated, due)
  - Custom fields (if configured)
- **Bulk Actions**
  - Select multiple → Update Status/Assignee
  - Export to CSV

### Issue Detail (`/issues/[id]`)
**Layout**: Two-column for desktop, stacked for mobile

**Left Column (Main)**:
- **Header Section**
  - Issue ID + Title (editable inline)
  - Breadcrumb: Project > Category > Issue
  - Status badge (colored)
- **Rich Text Description** (TipTap WYSIWYG)
  - Formatted text, images, code blocks
  - AI assistant button (floating)
- **Tabs**:
  - **Details** (default)
  - **Notes/Comments** - Threaded conversation
  - **History** - Audit trail of changes
  - **Attachments** - File list with previews

**Right Column (Sidebar)**:
- **Properties Panel** (TailAdmin form elements)
  - Status dropdown
  - Priority dropdown
  - Assignee select (with avatar)
  - Reporter (read-only)
  - Due Date picker
  - Category select
  - Tags (chip input)
- **Custom Fields** (if configured)
  - Dynamic form fields based on project config
- **Actions**
  - Edit button
  - Clone Issue
  - Watch/Unwatch
  - Delete (admin only)

### Issue Create/Edit (`/issues/new`, `/issues/[id]/edit`)
**Components**:
- **Form Layout** (TailAdmin form styling)
  - Title input (required)
  - Project select (required)
  - Category select
  - Description WYSIWYG (TipTap)
  - Status, Priority, Assignee dropdowns
  - Steps to Reproduce (WYSIWYG)
  - Additional Information (WYSIWYG)
  - Custom Fields (dynamic)
  - Attachments upload
- **Action Buttons**
  - Save (primary)
  - Save & View
  - Cancel (secondary)

### Search Page (`/search`)
**Components**:
- **Search Form** (Prominent)
  - Text search input (title, description, notes)
  - Advanced filters (expandable)
  - Saved searches dropdown
- **Results Table** (TailAdmin TableOne)
  - Same columns as Issues List
  - Highlight search terms in results
  - Pagination
- **Search Tips** (Collapsible)
  - Search operators documentation

## Component Specifications

### Issue Card (Board View)
```tsx
<div className="bg-white dark:bg-boxdark rounded-lg shadow p-4">
  <div className="flex justify-between items-start mb-2">
    <span className="text-sm text-meta-3">#{issue.id}</span>
    <PriorityBadge priority={issue.priority} />
  </div>
  <h4 className="font-medium mb-2 line-clamp-2">{issue.summary}</h4>
  <div className="flex justify-between items-center">
    <Avatar user={issue.assignee} size="sm" />
    <StatusBadge status={issue.status} />
  </div>
</div>
```

### Status Badge
**Colors** (from TailAdmin):
- **New**: `bg-meta-9 text-white` (blue)
- **Assigned**: `bg-meta-6 text-white` (yellow)
- **In Progress**: `bg-meta-8 text-white` (orange)
- **Resolved**: `bg-meta-5 text-white` (green)
- **Closed**: `bg-meta-1 text-white` (gray)

### Priority Badge
- **Low**: `border-meta-3 text-meta-3` (blue outline)
- **Normal**: `border-meta-1 text-meta-1` (gray outline)
- **High**: `border-meta-8 text-meta-8` (orange outline)
- **Urgent**: `bg-meta-7 text-white` (red filled)
- **Immediate**: `bg-meta-7 text-white animate-pulse` (red pulsing)

### Notes/Comments Thread
```tsx
<div className="space-y-4">
  {notes.map(note => (
    <div className="border-l-4 border-meta-5 pl-4 py-2">
      <div className="flex items-center gap-3 mb-2">
        <Avatar user={note.author} size="sm" />
        <span className="font-medium">{note.author.name}</span>
        <span className="text-sm text-meta-1">{formatDate(note.created)}</span>
      </div>
      <div className="prose dark:prose-invert"
           dangerouslySetInnerHTML={{ __html: note.text }} />
    </div>
  ))}
</div>
```

## TipTap WYSIWYG Integration

### Editor Toolbar
**Buttons** (TailAdmin button styling):
- **Format**: Bold, Italic, Underline, Strike
- **Headings**: H1, H2, H3
- **Lists**: Bullet, Numbered
- **Insert**: Link, Image, Code Block
- **AI Assist**: Floating button (bottom right)

### AI Assistant Panel (Inline)
**Trigger**: Click AI button or keyboard shortcut (Cmd/Ctrl+K)

**UI**: Slide-in panel from right
```
┌─────────────────────────────┐
│ AI Writing Assistant         │
├─────────────────────────────┤
│ Quick Actions:               │
│ • Improve writing            │
│ • Fix grammar                │
│ • Make shorter               │
│ • Make more technical        │
│                              │
│ Or type custom prompt:       │
│ ┌─────────────────────────┐ │
│ │ [Input]                 │ │
│ └─────────────────────────┘ │
│ [Generate] [Cancel]          │
└─────────────────────────────┘
```

## Notification Design

### Notification Bell (Top Nav)
- Badge count for unread
- Click opens dropdown panel

### Notification Panel
```tsx
<div className="w-80 max-h-96 overflow-y-auto">
  <div className="flex justify-between p-4 border-b">
    <h3>Notifications</h3>
    <button className="text-sm text-meta-5">Mark all read</button>
  </div>
  <div className="divide-y">
    {notifications.map(notif => (
      <div className={`p-4 hover:bg-gray ${!notif.read && 'bg-meta-9/10'}`}>
        <div className="flex gap-3">
          <NotificationIcon type={notif.type} />
          <div>
            <p className="text-sm">{notif.message}</p>
            <span className="text-xs text-meta-1">{notif.time}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

## Responsive Breakpoints

Using TailAdmin/Tailwind defaults:
- **Mobile**: < 768px (sm)
- **Tablet**: 768px - 1024px (md)
- **Desktop**: > 1024px (lg)

### Mobile Adaptations
- Sidebar collapses to hamburger menu
- Two-column layouts stack vertically
- Tables switch to card view
- Filters move to modal/drawer

## Color Palette (TailAdmin)

**Primary Colors**:
- `primary`: #3C50E0 (Blue - main actions)
- `secondary`: #80CAEE (Light Blue - secondary actions)

**Status Colors**:
- `success`: #10B981 (Green - success, resolved)
- `danger`: #F23838 (Red - errors, urgent)
- `warning`: #FFA70B (Orange - warnings, in progress)

**Neutral Colors**:
- `body`: #64748B (Body text)
- `bodydark`: #AEB7C0 (Secondary text)
- `stroke`: #E2E8F0 (Borders)

**Dark Mode**:
- `boxdark`: #24303F (Card background)
- `boxdark-2`: #1A222C (Page background)

## Accessibility Guidelines

1. **Keyboard Navigation**
   - All interactive elements keyboard accessible
   - Focus indicators visible (TailAdmin focus rings)
   - Skip links for main content

2. **Screen Readers**
   - Semantic HTML (`<main>`, `<nav>`, `<article>`)
   - ARIA labels for icon buttons
   - Status announcements for dynamic updates

3. **Color Contrast**
   - All text meets WCAG AA contrast ratios
   - Status not conveyed by color alone (icons + text)

4. **Form Validation**
   - Inline error messages
   - Required field indicators
   - Clear error descriptions

## Animation & Interactions

**Use TailAdmin Transitions**:
- Page transitions: `transition-opacity duration-200`
- Dropdown menus: `transition-transform duration-150`
- Modal overlays: `transition-opacity backdrop-blur`
- Loading states: `animate-pulse` or `animate-spin`

**Optimistic UI**:
- Status changes update immediately (rollback on error)
- Note submissions show instantly
- Notifications appear without page reload

## Empty States

**No Issues**:
```tsx
<div className="text-center py-12">
  <EmptyIcon className="mx-auto mb-4" />
  <h3 className="text-xl mb-2">No issues yet</h3>
  <p className="text-bodydark mb-4">
    Create your first issue to get started
  </p>
  <Button href="/issues/new">Create Issue</Button>
</div>
```

**No Search Results**:
- Show search tips
- Suggest removing filters
- Link to create new issue

## Performance Optimizations

1. **Code Splitting**
   - TipTap editor lazy loaded
   - Board view lazy loaded
   - Admin pages separate bundle

2. **Image Optimization**
   - Next.js Image component for avatars
   - Lazy load attachment previews

3. **Data Loading**
   - Server components for initial render
   - Client components for interactivity
   - React Query for data fetching/caching

4. **Bundle Size**
   - Tree-shake TailAdmin components
   - Use TailAdmin CSS only for used components