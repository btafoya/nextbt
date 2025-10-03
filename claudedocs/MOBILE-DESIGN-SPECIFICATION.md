# NextBT Mobile Design Specification

## Executive Summary

NextBT currently has **severe mobile usability issues** that render the application unusable on devices ≤768px wide. This specification provides a comprehensive mobile-first redesign addressing critical layout, navigation, and interaction problems.

---

## 🚨 Current Problems (Critical)

### 1. Fixed Sidebar Breaks Mobile Layout
**Current Implementation:**
```typescript
// layout.tsx - Fixed sidebar with 288px left margin
<div className="flex h-screen">
  <Sidebar /> {/* Fixed 288px width, always visible */}
  <main className="ml-72 flex-1 overflow-auto"> {/* 288px margin */}
```

**Problems:**
- Sidebar covers 80% of iPhone screen (375px width)
- Main content area only 87px wide on mobile
- No responsive breakpoints implemented
- Sidebar doesn't collapse or hide

### 2. Non-Responsive Data Tables
**Current Implementation:**
- Fixed-width columns
- Horizontal scrolling for all content
- No mobile card view alternative
- Too much information density

### 3. Touch Targets Below Minimum Size
**Current Implementation:**
- Navigation links: ~36px height (below 44px minimum)
- Buttons: variable sizes, many below 44×44px
- Form inputs: insufficient spacing for mobile keyboards

### 4. Content Layout Breaks on Small Screens
**Issue Detail Page Problems:**
- 2-column grid collapses incorrectly
- Text too small for comfortable mobile reading
- Insufficient padding for touch interaction
- Status badges overlap on narrow screens

---

## 📱 Mobile-First Design System

### Responsive Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small tablets, large phones landscape */
md: 768px   /* Tablets portrait */
lg: 1024px  /* Tablets landscape, small laptops */
xl: 1280px  /* Laptops, desktops */
2xl: 1536px /* Large desktops */
```

**NextBT Strategy:**
- **Mobile-first**: Base styles for <640px
- **Tablet**: md: (768px+) for sidebar transition
- **Desktop**: lg: (1024px+) for full desktop layout

---

## 🎨 Layout Architecture

### Responsive Layout System

```typescript
// Three layout modes based on screen size

1. Mobile (<768px):
   - Hidden sidebar (overlay drawer)
   - Full-width main content
   - Bottom tab navigation
   - Hamburger menu trigger

2. Tablet (768px-1024px):
   - Collapsible sidebar (icon-only mode)
   - Reduced margin on main content
   - Touch-optimized controls

3. Desktop (1024px+):
   - Full sidebar always visible
   - Current layout preserved
   - Mouse-optimized interactions
```

### Implementation: Responsive Dashboard Layout

**New Layout Component:**
```typescript
// app/(dash)/layout.tsx - REVISED
export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const sidebarSession = {
    uid: session.uid,
    username: session.username,
    projects: session.projects,
    access_level: session.access_level,
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Mobile: Hidden sidebar with drawer overlay */}
      <MobileSidebar session={sidebarSession} />

      {/* Desktop: Fixed sidebar (hidden on mobile) */}
      <DesktopSidebar session={sidebarSession} />

      {/* Main content - responsive margin */}
      <main className="
        flex-1 overflow-auto p-4
        md:ml-16 md:p-6
        lg:ml-72
      ">
        {/* Mobile header with hamburger menu */}
        <MobileHeader />

        {children}
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav session={sidebarSession} />
    </div>
  );
}
```

---

## 🍔 Mobile Navigation Patterns

### 1. Hamburger Menu + Drawer Sidebar

**Components:**
```typescript
// components/layout/MobileSidebar.tsx
export function MobileSidebar({ session }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72
        transform transition-transform duration-300
        bg-white dark:bg-boxdark shadow-xl
        lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar content */}
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-strokedark">
            <div className="flex items-center gap-3">
              <Image src={siteLogo} alt={siteName} width={32} height={32} />
              <h2 className="text-xl font-bold">{siteName}</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-meta-4
                  active:bg-gray-200 dark:active:bg-gray-700
                  min-h-[44px]" {/* Touch target minimum */}
                onClick={() => setIsOpen(false)}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-base font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer with theme toggle and logout */}
          <div className="border-t dark:border-strokedark p-4">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
```

**Hamburger Menu Trigger:**
```typescript
// components/layout/MobileHeader.tsx
export function MobileHeader() {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom); // Global state

  return (
    <div className="flex items-center justify-between mb-4 lg:hidden">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg"
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile page title */}
      <h1 className="text-lg font-semibold truncate dark:text-white">
        {/* Page-specific title */}
      </h1>

      {/* Mobile actions */}
      <div className="flex items-center gap-2">
        {/* Search, notifications, etc. */}
      </div>
    </div>
  );
}
```

### 2. Bottom Tab Navigation (Mobile)

**Primary navigation for mobile:**
```typescript
// components/layout/MobileBottomNav.tsx
export function MobileBottomNav({ session }: SidebarProps) {
  const pathname = usePathname();

  const mainNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/issues", label: "Issues", icon: Bug },
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-30
      bg-white dark:bg-boxdark
      border-t border-gray-200 dark:border-strokedark
      lg:hidden
      safe-area-inset-bottom" {/* iOS safe area */}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                w-full min-h-[56px] rounded-lg
                transition-colors
                ${isActive
                  ? 'text-primary dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
                }
                hover:bg-gray-100 dark:hover:bg-meta-4
                active:bg-gray-200 dark:active:bg-gray-700
              `}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 3. Desktop Sidebar (Unchanged)

**Preserved for desktop:**
```typescript
// components/layout/DesktopSidebar.tsx
export function DesktopSidebar({ session }: SidebarProps) {
  return (
    <aside className="
      hidden lg:flex
      fixed left-0 top-0 z-50
      h-screen w-72
      flex-col overflow-y-auto
      bg-white shadow-xl dark:bg-boxdark
    ">
      {/* Current sidebar implementation */}
    </aside>
  );
}
```

---

## 📊 Responsive Data Tables

### Problem: Current Table Unusable on Mobile

**Solution: Adaptive View Patterns**

```typescript
// components/ui/ResponsiveDataTable.tsx

export function ResponsiveDataTable<TData>({
  columns,
  data,
  mobileCardRenderer, // Custom mobile card component
}: ResponsiveDataTableProps<TData>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile && mobileCardRenderer) {
    // Mobile: Card view
    return (
      <div className="space-y-3">
        {data.map((row, idx) => mobileCardRenderer(row, idx))}
      </div>
    );
  }

  // Desktop: Standard table
  return <DataTable columns={columns} data={data} />;
}
```

### Mobile Issue Card Pattern

```typescript
// components/issues/IssueCard.tsx - Mobile card view
export function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="
        block p-4
        bg-white dark:bg-boxdark
        border dark:border-strokedark
        rounded-lg shadow-sm
        hover:shadow-md transition-shadow
        active:bg-gray-50 dark:active:bg-meta-4
      "
    >
      {/* Issue header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate dark:text-white">
            #{issue.id} {issue.summary}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {issue.project.name}
          </p>
        </div>

        {/* Status badge */}
        <StatusBadge status={issue.status} size="sm" />
      </div>

      {/* Issue metadata */}
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <PriorityBadge priority={issue.priority} size="sm" />
        <span>•</span>
        <span>{formatDistanceToNow(new Date(issue.last_updated * 1000))}</span>
      </div>
    </Link>
  );
}
```

### Usage in Issues Page

```typescript
// app/(dash)/issues/page.tsx - REVISED
export default async function IssuesPage() {
  const issues = await getIssues();

  return (
    <div className="space-y-4 pb-20 lg:pb-0"> {/* Bottom nav spacing */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold dark:text-white">Issues</h1>
        <Link href="/issues/new">
          <Button size="sm" className="lg:size-default">
            <Plus size={20} className="lg:hidden" />
            <span className="hidden lg:inline">Create New Issue</span>
          </Button>
        </Link>
      </div>

      {/* Responsive table/cards */}
      <ResponsiveDataTable
        columns={columns}
        data={issues}
        mobileCardRenderer={(issue) => <IssueCard issue={issue} />}
      />
    </div>
  );
}
```

---

## 🎯 Touch Target Guidelines

### Minimum Sizes (WCAG 2.5.5)

```css
/* Touch target minimum: 44×44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;

  /* Spacing between targets: 8px minimum */
  margin: 4px;

  /* Visual feedback */
  transition: background-color 150ms ease;
}

/* Active state for touch */
.touch-target:active {
  transform: scale(0.98);
  background-color: /* darker shade */;
}
```

### Component Examples

**Buttons:**
```typescript
// components/ui/button.tsx - Touch-optimized variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      size: {
        sm: "h-9 px-3 text-sm",           // Desktop compact
        default: "h-11 px-4 py-2",        // Standard (44px height)
        lg: "h-12 px-6 text-lg",          // Touch-optimized (48px)
        icon: "h-11 w-11",                // Icon buttons (44px)
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);
```

**Navigation Items:**
```css
/* Sidebar navigation - touch-optimized */
.sidebar-nav-item {
  min-height: 44px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  /* Touch feedback */
  @apply active:bg-gray-200 dark:active:bg-gray-700;

  /* Icon size */
  font-size: 24px; /* Larger icons for visibility */
}
```

---

## 📄 Issue Detail Page Mobile Design

### Current Problems
- 2-column grid breaks layout
- Information density too high
- Small text, cramped spacing
- Badges overlap

### Mobile-Optimized Layout

```typescript
// app/(dash)/issues/[id]/page.tsx - Mobile improvements
export default async function IssueShow({ params }: { params: { id: string } }) {
  // ... data fetching

  return (
    <div className="space-y-4 pb-20 lg:pb-4"> {/* Bottom nav spacing */}
      {/* Mobile-optimized header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg lg:text-2xl font-bold dark:text-white flex-1 min-w-0">
            <span className="text-gray-500 dark:text-gray-400">#{issue.id}</span>
            {" "}
            <span className="block lg:inline">{issue.summary}</span>
          </h1>

          {/* Mobile: Stack badges vertically */}
          <div className="flex flex-col lg:flex-row gap-2 flex-shrink-0">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </div>

        {/* Edit button (full-width on mobile) */}
        {userCanEdit && (
          <Link
            href={`/issues/${issue.id}/edit`}
            className="
              block lg:inline-block w-full lg:w-auto
              text-center px-4 py-2 min-h-[44px]
              bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 active:bg-blue-800
            "
          >
            Edit Issue
          </Link>
        )}
      </div>

      {/* Status actions (horizontal scroll on mobile) */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <StatusActions
          issueId={issue.id}
          currentStatus={issue.status}
          canEdit={userCanEdit}
        />
      </div>

      {/* Issue details card */}
      <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded-lg p-4 lg:p-6 space-y-4">
        {/* Mobile: Single column, Desktop: Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 text-sm dark:text-gray-300">
          <DetailRow label="Project">
            <Link href={`/projects/${issue.project_id}`} className="text-blue-600 dark:text-blue-400">
              {issue.project.name}
            </Link>
          </DetailRow>

          <DetailRow label="Reporter">
            <Link href={`/issues?reporter=${issue.reporter_id}`} className="text-blue-600 dark:text-blue-400">
              {issue.reporter.realname || issue.reporter.username}
            </Link>
          </DetailRow>

          <DetailRow label="Status">
            {getStatusLabel(issue.status)}
          </DetailRow>

          <DetailRow label="Priority">
            {getPriorityLabel(issue.priority)}
          </DetailRow>

          {/* ... more fields */}
        </div>

        <hr className="dark:border-strokedark" />

        {/* Description (full-width, larger text on mobile) */}
        <div>
          <h2 className="text-base lg:text-lg font-semibold mb-3 dark:text-white">
            Description
          </h2>
          <div className="prose prose-sm lg:prose-base dark:prose-invert max-w-none">
            <HtmlContent html={description} />
          </div>
        </div>

        {/* Steps to reproduce */}
        {issue.text?.steps_to_reproduce && (
          <div>
            <h2 className="text-base lg:text-lg font-semibold mb-3 dark:text-white">
              Steps to Reproduce
            </h2>
            <div className="prose prose-sm lg:prose-base dark:prose-invert max-w-none">
              <HtmlContent html={issue.text.steps_to_reproduce} />
            </div>
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <ActivityTimeline issueId={issue.id} currentUserId={session.uid} />
    </div>
  );
}

// Helper component for consistent detail rows
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
      <span className="font-semibold dark:text-white whitespace-nowrap">
        {label}:
      </span>
      <span className="text-gray-700 dark:text-gray-300">{children}</span>
    </div>
  );
}
```

---

## 🎨 Mobile-Optimized Form Design

### Issue Create/Edit Forms

```typescript
// app/(dash)/issues/new/page.tsx - Mobile improvements
export default function NewIssuePage() {
  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
      <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 dark:text-white">
        Create New Issue
      </h1>

      <form className="space-y-4 lg:space-y-6">
        {/* Full-width inputs on mobile */}
        <div>
          <label className="form-label text-base">Summary</label>
          <input
            type="text"
            className="form-input text-base min-h-[44px]" {/* Touch-optimized */}
            placeholder="Brief description of the issue"
          />
        </div>

        {/* Select dropdowns - larger touch targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label text-base">Project</label>
            <select className="form-input text-base min-h-[44px]">
              <option>Select project...</option>
            </select>
          </div>

          <div>
            <label className="form-label text-base">Priority</label>
            <select className="form-input text-base min-h-[44px]">
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        {/* WYSIWYG editor - optimized for mobile */}
        <div>
          <label className="form-label text-base">Description</label>
          <Editor
            content={description}
            onChange={setDescription}
            placeholder="Describe the issue..."
            mobileOptimized={true} {/* Larger buttons, simplified toolbar */}
          />
        </div>

        {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <Button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] text-base order-2 sm:order-1"
          >
            Create Issue
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto min-h-[44px] text-base order-1 sm:order-2"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

## 🔧 Global CSS Improvements

### Responsive Utilities

```css
/* globals.css additions */

/* Safe area insets for iOS */
@supports (padding: max(0px)) {
  .safe-area-inset-bottom {
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }

  .safe-area-inset-top {
    padding-top: max(0.5rem, env(safe-area-inset-top));
  }
}

/* Prevent content from going under bottom nav */
@layer utilities {
  .pb-mobile-nav {
    @apply pb-20 lg:pb-0;
  }
}

/* Touch-optimized scrolling */
* {
  -webkit-overflow-scrolling: touch;
}

/* Disable text selection on UI elements */
button, a, .no-select {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
}

/* Ensure text inputs allow selection */
input, textarea, [contenteditable] {
  user-select: text;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Mobile Typography

```css
/* Enhanced mobile typography */
@layer base {
  /* Base font size increases on mobile for readability */
  html {
    font-size: 16px; /* Mobile base */
  }

  @media (min-width: 768px) {
    html {
      font-size: 16px; /* Desktop base */
    }
  }

  /* Headings scale appropriately */
  h1 {
    @apply text-xl lg:text-3xl;
  }

  h2 {
    @apply text-lg lg:text-2xl;
  }

  h3 {
    @apply text-base lg:text-xl;
  }

  /* Body text minimum 16px for mobile */
  body {
    @apply text-base leading-relaxed;
  }
}
```

---

## 🧪 Testing Requirements

### Mobile Testing Checklist

**Device Testing:**
- [ ] iPhone SE (375×667) - Smallest modern iPhone
- [ ] iPhone 14 Pro (393×852) - Current standard
- [ ] iPhone 14 Pro Max (430×932) - Largest iPhone
- [ ] Samsung Galaxy S23 (360×780) - Standard Android
- [ ] iPad Mini (744×1133) - Small tablet
- [ ] iPad Pro (1024×1366) - Large tablet

**Orientation Testing:**
- [ ] Portrait mode (primary)
- [ ] Landscape mode (secondary)
- [ ] Rotation transition smoothness

**Touch Interaction Testing:**
- [ ] All touch targets ≥44×44px
- [ ] Swipe gestures (drawer open/close)
- [ ] Scroll performance (list views)
- [ ] Form input focus/keyboard handling
- [ ] Pinch-to-zoom disabled on UI elements
- [ ] Double-tap zoom disabled on buttons

**Layout Testing:**
- [ ] Sidebar drawer opens/closes smoothly
- [ ] Bottom navigation always accessible
- [ ] Content doesn't overlap with bottom nav
- [ ] Horizontal scrolling eliminated
- [ ] Tables convert to cards on mobile
- [ ] Forms stack properly on narrow screens

**Performance Testing:**
- [ ] Page load < 3 seconds on 3G
- [ ] Smooth 60fps scrolling
- [ ] No layout jank during transitions
- [ ] Images optimized for mobile

---

## 📋 Implementation Checklist

### Phase 1: Core Mobile Layout (High Priority)

- [ ] **Create responsive layout components**
  - [ ] `components/layout/MobileSidebar.tsx` (drawer)
  - [ ] `components/layout/DesktopSidebar.tsx` (existing)
  - [ ] `components/layout/MobileHeader.tsx` (hamburger menu)
  - [ ] `components/layout/MobileBottomNav.tsx` (bottom tabs)

- [ ] **Update dashboard layout**
  - [ ] Modify `app/(dash)/layout.tsx` with responsive structure
  - [ ] Add global state for sidebar open/close (Jotai/Zustand)
  - [ ] Implement sidebar overlay backdrop
  - [ ] Add bottom navigation spacing to pages

- [ ] **CSS responsive improvements**
  - [ ] Update `globals.css` with safe area insets
  - [ ] Add touch-optimized utilities
  - [ ] Fix sidebar breakpoints
  - [ ] Add mobile typography scales

### Phase 2: Component Responsiveness (High Priority)

- [ ] **Data tables**
  - [ ] Create `ResponsiveDataTable` component
  - [ ] Design `IssueCard` mobile view
  - [ ] Update issues page to use responsive table
  - [ ] Test horizontal scroll elimination

- [ ] **Forms**
  - [ ] Update all form inputs to min-h-[44px]
  - [ ] Adjust button sizing for touch targets
  - [ ] Stack form elements on mobile
  - [ ] Optimize WYSIWYG editor toolbar for mobile

- [ ] **Issue detail page**
  - [ ] Convert 2-column grid to single column on mobile
  - [ ] Stack badges vertically on mobile
  - [ ] Increase content text size
  - [ ] Optimize activity timeline for mobile

### Phase 3: Touch Optimization (Medium Priority)

- [ ] **Touch targets**
  - [ ] Audit all interactive elements for 44×44px minimum
  - [ ] Add proper spacing between touch targets
  - [ ] Implement active states for touch feedback
  - [ ] Test with real devices

- [ ] **Gestures**
  - [ ] Swipe-to-open sidebar drawer
  - [ ] Swipe-to-close sidebar drawer
  - [ ] Pull-to-refresh on issue list (optional)
  - [ ] Swipe actions on issue cards (optional)

### Phase 4: Performance & Polish (Medium Priority)

- [ ] **Performance**
  - [ ] Optimize images for mobile (Next.js Image)
  - [ ] Lazy load components below fold
  - [ ] Reduce initial bundle size
  - [ ] Test on 3G network

- [ ] **Accessibility**
  - [ ] ARIA labels for mobile navigation
  - [ ] Keyboard navigation support
  - [ ] Screen reader testing
  - [ ] Focus management for drawer

- [ ] **Visual polish**
  - [ ] Smooth animations (sidebar, drawer)
  - [ ] Loading states for mobile
  - [ ] Empty states for mobile
  - [ ] Error states for mobile

### Phase 5: Testing & Documentation (Low Priority)

- [ ] **Device testing** (see testing checklist above)
- [ ] **Update documentation**
  - [ ] Add mobile design guidelines to CLAUDE.md
  - [ ] Document responsive breakpoints
  - [ ] Component usage examples
- [ ] **User acceptance testing**
  - [ ] Test with real users on mobile devices
  - [ ] Gather feedback and iterate

---

## 🚀 Quick Wins (Immediate Fixes)

These can be implemented immediately for fast improvements:

### 1. Fix Sidebar Overlap (15 minutes)
```css
/* globals.css */
.sidebar {
  @apply hidden lg:flex; /* Hide sidebar on mobile */
}

/* layout.tsx main content */
main {
  @apply ml-0 lg:ml-72; /* Remove left margin on mobile */
}
```

### 2. Add Bottom Spacing for Content (5 minutes)
```typescript
// Add to all page components
<div className="pb-20 lg:pb-0"> {/* 80px bottom padding for mobile nav */}
  {children}
</div>
```

### 3. Increase Touch Targets (10 minutes)
```css
/* globals.css */
.sidebar-nav-item {
  @apply min-h-[44px]; /* Ensure minimum touch target */
}

button, .btn {
  @apply min-h-[44px] min-w-[44px]; /* All buttons touch-optimized */
}
```

### 4. Mobile Typography (10 minutes)
```css
/* globals.css */
h1 {
  @apply text-xl lg:text-2xl; /* Smaller on mobile */
}

body {
  @apply text-base; /* Ensure 16px minimum */
}
```

---

## 🎯 Success Metrics

### Usability Goals
- ✅ All interactive elements ≥44×44px
- ✅ No horizontal scrolling required
- ✅ Content readable without zoom (16px+ text)
- ✅ Navigation accessible within 1 tap
- ✅ Forms completable on mobile keyboard

### Performance Goals
- ✅ First Contentful Paint < 1.5s on 3G
- ✅ Time to Interactive < 3.5s on 3G
- ✅ Smooth 60fps scrolling
- ✅ Zero layout shift (CLS = 0)

### Accessibility Goals
- ✅ WCAG 2.1 AA compliance
- ✅ Touch target spacing ≥8px
- ✅ Color contrast ≥4.5:1
- ✅ Screen reader compatible
- ✅ Keyboard navigation support

---

## 📚 References

### Design Systems
- **Material Design**: https://m3.material.io/
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **Tailwind CSS Responsive Design**: https://tailwindcss.com/docs/responsive-design

### Touch Interaction
- **WCAG 2.5.5 Target Size**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- **Touch Target Sizes**: https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/

### Mobile Patterns
- **Bottom Navigation**: https://m2.material.io/components/bottom-navigation
- **Navigation Drawer**: https://m2.material.io/components/navigation-drawer
- **Responsive Tables**: https://css-tricks.com/responsive-data-tables/

---

## ✅ Summary

This specification provides a comprehensive solution to NextBT's mobile usability crisis:

**Critical Fixes:**
1. ✅ Responsive sidebar (drawer on mobile, fixed on desktop)
2. ✅ Bottom tab navigation for primary mobile navigation
3. ✅ Adaptive data tables (cards on mobile, tables on desktop)
4. ✅ Touch-optimized components (44×44px minimum)
5. ✅ Mobile-first layout with proper breakpoints

**Implementation Priority:**
- **Phase 1** (High): Core layout responsiveness - **2-3 days**
- **Phase 2** (High): Component responsiveness - **2-3 days**
- **Phase 3** (Medium): Touch optimization - **1-2 days**
- **Phase 4** (Medium): Performance & polish - **1-2 days**
- **Phase 5** (Low): Testing & documentation - **1-2 days**

**Total Estimated Time: 7-12 days** for complete mobile transformation.

**Quick Wins**: Implement sidebar hide + bottom spacing in **1 hour** for immediate 80% improvement.
