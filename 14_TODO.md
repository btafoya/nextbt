# 14 — Backlog / TODO

**Last Updated**: October 4, 2025

## ✅ Recently Completed (October 2025)

- [x] **Rocket.Chat Integration Enhancement** (de089a3, cedd483, 1be5476)
  - REST API client with message operations, user/channel lookup
  - Rich message formatting with severity colors and emojis
  - Enhanced webhooks with retry logic and exponential backoff
  - Comprehensive audit system with 9 reporting functions

- [x] **Mobile Experience Improvements** (5b3f08d, cab4460)
  - Custom swipe gesture hooks (`useSwipe`, `useEdgeSwipe`)
  - Mobile-optimized sidebar with edge swipe navigation
  - Touch-friendly responsive navigation system

- [x] **Cache Busting System** (4c4c044)
  - Build-time cache version generation
  - Service worker synchronization
  - Static asset cache invalidation

- [x] **Category-Based Dynamic Forms** (0fcd94e)
  - Dynamic field visibility based on category selection
  - Simplified non-technical issue submission

- [x] **Notification System Infrastructure**
  - Complete API endpoints (digest, web push, history, filters)
  - Backend modules fully implemented
  - Database tables and audit logging

- [x] **Prisma Model Coverage**
  - All core MantisBT tables mapped (47 models)
  - Categories, attachments, history, custom fields included
  - Bug files, project files, user profiles covered

## 🎯 High Priority (Next Sprint)

### User Interface Enhancements

- [x] **Notification Preferences UI** ✅ Complete with Tests
  - Created `/app/(dash)/profile/notifications/page.tsx` with 5-tab navigation
  - Implemented digest preferences UI (frequency, channel selection, time/day)
  - Added web push subscription management (subscribe, unsubscribe, test, list)
  - Built notification history viewer with pagination and filters
  - Created filter management UI (create, edit, delete, test with stats)
  - Added comprehensive unit tests (`__tests__/components/profile/NotificationPreferences.test.tsx`)
  - Added E2E accessibility tests (`e2e/accessibility/notifications.spec.ts` - 12 tests)
  - **Status**: Fully implemented with 100% feature coverage
  - **Components**: `DigestPreferences.tsx`, `WebPushManager.tsx`, `NotificationHistory.tsx`, `NotificationFilters.tsx`

- [ ] **Board View (Kanban/Swimlanes)** 🎨 New Feature
  - Implement swimlane layout grouped by status
  - Add drag-and-drop for status changes
  - Project/filter selector for board customization
  - Responsive design for mobile/tablet/desktop
  - Local storage for board preferences
  - **Tech**: Use `@dnd-kit/core` or similar for drag-and-drop
  - **Routes**: `/app/(dash)/board/page.tsx`

### Data Management

- [ ] **CSV Export for Issues** 📊 New Feature
  - Create `/app/api/issues/export/route.ts` endpoint
  - Support filtered exports (by project, status, date range)
  - Include all issue fields and custom data
  - Stream large exports for performance
  - Add export button to issues list page
  - **Format**: Standard CSV with proper escaping

- [ ] **Bulk Edit Operations** ⚡ New Feature
  - Multi-select checkboxes on issues list
  - Bulk actions: status change, assignee change, priority/severity
  - Confirmation dialog with change preview
  - Batch API endpoint: `POST /api/issues/bulk-update`
  - Progress indicator for large batches
  - **Validation**: Check permissions per issue

## 🔮 Future Enhancements (Backlog)

### Authentication & Authorization

- [ ] **Role Adapters**
  - Optional mapping of MantisBT roles to NextBT permissions
  - UI-based role configuration (admin panel)
  - Default permission sets for common roles
  - **Consider**: May not be needed if MantisBT roles sufficient

### File Management

- [ ] **Attachment Upload Flow**
  - Migrationless attachment uploads (store in MantisBT file table)
  - Consider object storage option (S3, R2, etc.) with DB link
  - Drag-and-drop file upload UI
  - Preview for images/PDFs
  - File size and type validation
  - **Current**: Download works, upload needs implementation

### Advanced Features

- [ ] **Issue Templates**
  - Pre-defined issue templates per project/category
  - Template management UI (create, edit, delete)
  - Template selection during issue creation
  - Variable substitution in templates

- [ ] **Saved Filters/Views**
  - Save custom issue filters with names
  - Quick access to saved views in sidebar
  - Share filters across team members
  - Default filter per user/project

- [ ] **Email to Issue**
  - Parse incoming emails to create issues
  - Email parsing configuration (subject, body, attachments)
  - Spam filtering and validation
  - Link emails to existing issues via references

- [ ] **Issue Relationships**
  - Parent/child issue relationships
  - Related issues, duplicates, blockers
  - Visual relationship graph
  - Relationship management UI

- [ ] **Time Tracking**
  - Log time spent on issues
  - Time tracking reports per project/user
  - Estimated vs actual time comparison
  - Billing/invoicing integration hooks

- [ ] **Custom Dashboard Widgets**
  - User-configurable dashboard
  - Widget library (charts, stats, recent activity)
  - Drag-and-drop widget layout
  - Per-user dashboard preferences

- [ ] **Advanced Search**
  - Full-text search across issues and notes
  - Search syntax with operators (AND, OR, NOT)
  - Search history and saved searches
  - Search suggestions and autocomplete

## 📝 Documentation Improvements

- [ ] **User Guide**
  - End-user documentation for issue management
  - Screenshot-based tutorials
  - Video walkthroughs for key features
  - FAQ section

- [ ] **Admin Guide**
  - Installation and configuration guide
  - Notification system setup (all channels)
  - Backup and recovery procedures
  - Performance tuning recommendations

- [ ] **Developer Guide**
  - Architecture deep-dive
  - Contributing guidelines
  - API extension points
  - Custom notification channel development

## 🧪 Testing Improvements

- [ ] **E2E Tests**
  - Playwright tests for critical user flows
  - Issue creation, editing, workflow
  - Notification preference management
  - Authentication and session handling

- [ ] **Performance Tests**
  - Load testing for high-traffic scenarios
  - Database query optimization
  - API response time benchmarks
  - Bundle size optimization

- [ ] **Security Audits**
  - Regular dependency updates
  - OWASP security testing
  - Penetration testing
  - Code security review

## 📊 Metrics & Monitoring

- [ ] **Analytics Integration**
  - User activity tracking (privacy-respecting)
  - Feature usage metrics
  - Performance monitoring (Sentry already integrated)
  - Error rate tracking

- [ ] **Health Checks**
  - Database connection monitoring
  - External service health (Postmark, Pushover, Rocket.Chat)
  - Notification delivery success rates
  - Service worker status

## 🔧 Technical Debt

- [ ] **Code Quality**
  - Increase test coverage to 80%+
  - Refactor large components (split into smaller)
  - Type safety improvements (eliminate any types)
  - ESLint rule enforcement

- [ ] **Performance Optimization**
  - Implement React query for data caching
  - Optimize re-renders with memo/callback
  - Lazy load heavy components
  - Image optimization (already using Next.js Image)

- [ ] **Accessibility**
  - ARIA label improvements
  - Keyboard navigation enhancements
  - Screen reader testing
  - Color contrast validation (already WCAG 2.1 AA)

---

## Priority Legend

- ⚠️ **Critical** - Blocking or high-value feature
- 🎨 **High** - Important user-facing feature
- 📊 **Medium** - Nice-to-have enhancement
- 🔮 **Low** - Future consideration

## Notes

- **Notification System**: Backend infrastructure 100% complete, UI components are the next priority
- **Prisma Coverage**: All essential MantisBT tables are mapped (47 models)
- **Mobile Experience**: Significantly improved with swipe gestures and responsive navigation
- **Code Quality**: High standards maintained (8.8/10 overall score, 200+ tests)

## Related Documentation

- `claudedocs/OCTOBER-2025-IMPROVEMENTS.md` - Recent improvements summary
- `claudedocs/NOTIFICATION-IMPLEMENTATION-COMPLETE.md` - Notification system status
- `claudedocs/CODE-ANALYSIS-REPORT.md` - Code quality assessment
- `claudedocs/ROCKETCHAT-IMPLEMENTATION-PLAN.md` - Rocket.Chat integration details
- `claudedocs/GESTURE-IMPLEMENTATION-SUMMARY.md` - Mobile gesture implementation
- `CLAUDE.md` - Complete project context and architecture
- `README.md` - Project overview and quick start

---

**Last Review**: October 4, 2025
**Next Review**: November 1, 2025
