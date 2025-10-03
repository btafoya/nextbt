"use client";
import { useAtom } from "jotai";
import { useEdgeSwipe } from "@/lib/hooks/useSwipe";
import { sidebarOpenAtom } from "@/lib/atoms";

/**
 * EdgeSwipeDetector - Invisible component that detects edge swipes to open sidebar
 *
 * Detects swipes from the left edge of the screen to open the mobile sidebar.
 * Only active on mobile devices (hidden on desktop via lg:hidden check).
 */
export function EdgeSwipeDetector() {
  const [, setIsOpen] = useAtom(sidebarOpenAtom);

  // Detect swipe from left edge to open sidebar
  useEdgeSwipe({
    onSwipeFromLeftEdge: () => {
      // Only open on mobile (check window width to avoid desktop)
      if (window.innerWidth < 1024) {
        setIsOpen(true);
      }
    },
    edgeDistance: 20, // 20px from edge
    minSwipeDistance: 50, // Minimum 50px swipe
  });

  // This component renders nothing - it only handles gestures
  return null;
}
