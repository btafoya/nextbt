# NextBT Mobile Gesture Quick Reference

**Quick guide for developers and testers**

---

## 🎯 Available Gestures

### 1. Open Sidebar from Edge
- **Action**: Swipe right from left edge of screen
- **Zone**: 0-20px from left edge
- **Distance**: 50px minimum
- **Result**: Opens mobile sidebar drawer

### 2. Close Sidebar with Swipe
- **Action**: Swipe left on open sidebar
- **Distance**: 50px minimum
- **Result**: Closes sidebar drawer

### 3. Close Sidebar via Backdrop
- **Action**: Swipe in any direction on backdrop
- **Distance**: 30px minimum
- **Result**: Closes sidebar drawer

---

## 🔧 For Developers

### Adding Swipe to New Elements

```typescript
import { useSwipe } from "@/lib/hooks/useSwipe";
import { useRef } from "react";

function MyComponent() {
  const elementRef = useRef<HTMLDivElement>(null);

  useSwipe(elementRef, {
    onSwipeLeft: () => console.log("Swiped left"),
    onSwipeRight: () => console.log("Swiped right"),
    minSwipeDistance: 50,
  });

  return <div ref={elementRef}>Swipeable content</div>;
}
```

### Adding Edge Swipe Detection

```typescript
import { useEdgeSwipe } from "@/lib/hooks/useSwipe";

function MyComponent() {
  useEdgeSwipe({
    onSwipeFromLeftEdge: () => console.log("Swiped from left edge"),
    edgeDistance: 20,
    minSwipeDistance: 50,
  });

  return <div>Component with edge detection</div>;
}
```

---

## 🧪 Testing Gestures

### Chrome DevTools Mobile Emulation
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select mobile device (iPhone, Pixel, etc.)
4. **Important**: Click "Edit" → Enable "Touch" mode
5. Test swipe gestures with mouse drag

### Real Device Testing
1. Connect device via USB
2. Enable USB debugging (Android) or connect via Safari (iOS)
3. Navigate to http://[your-ip]:3818
4. Test all 3 gesture types

### Testing Checklist
- [ ] Swipe from left edge opens sidebar
- [ ] Swipe left on sidebar closes it
- [ ] Swipe on backdrop closes sidebar
- [ ] Gestures work in portrait
- [ ] Gestures work in landscape
- [ ] Content scrolling still works
- [ ] Buttons still work (fallback)

---

## ❓ Troubleshooting

### Gestures Not Working
1. **Check device width**: Gestures disabled on desktop (≥1024px)
2. **Check touch events**: Desktop browsers may not support touch
3. **Check browser**: Use mobile browser, not desktop emulation
4. **Check console**: Look for JavaScript errors

### Edge Swipe Not Opening Sidebar
1. Start swipe within 20px of left edge
2. Swipe at least 50px to the right
3. Check window.innerWidth < 1024

### Swipe Closes But Buttons Don't Work
1. This is a separate issue (buttons should always work)
2. Check for JavaScript errors in console
3. Verify Jotai state is working

---

## 📊 Technical Details

### Hook Files
- `lib/hooks/useSwipe.ts` - Swipe detection hooks

### Component Files
- `components/layout/EdgeSwipeDetector.tsx` - Edge swipe handler
- `components/layout/MobileSidebar.tsx` - Sidebar with swipe support

### State Management
- `lib/atoms.ts` - Jotai atom for sidebar state (`sidebarOpenAtom`)

### Thresholds
- **Edge Distance**: 20px from screen edge
- **Minimum Swipe**: 50px for sidebar, 30px for backdrop
- **Mobile Breakpoint**: <1024px

---

## 🎨 User Experience

### Visual Feedback
- Smooth 300ms transition animation
- Backdrop fades in/out
- Sidebar slides from left

### Accessibility
- All gestures have button alternatives
- ARIA labels on buttons
- Keyboard navigation preserved
- Screen reader compatible

---

## 🚀 Performance

### Optimizations
- Passive event listeners (non-blocking)
- Ref-based tracking (no re-renders)
- Minimal bundle size (~2.5KB)
- Zero performance overhead

### Browser Support
- iOS Safari 13+
- Chrome Mobile 90+
- Firefox Mobile 90+
- Samsung Internet 14+

---

**Last Updated**: October 3, 2025
**Version**: 1.0
