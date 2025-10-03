import { useEffect, useRef, RefObject } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  preventScroll?: boolean;
}

/**
 * Custom hook for detecting swipe gestures on touch devices
 *
 * @param elementRef - Reference to the element to attach swipe listeners
 * @param options - Swipe configuration options
 *
 * @example
 * const sidebarRef = useRef(null);
 * useSwipe(sidebarRef, {
 *   onSwipeLeft: () => closeSidebar(),
 *   minSwipeDistance: 50
 * });
 */
export function useSwipe<T extends HTMLElement>(
  elementRef: RefObject<T>,
  options: SwipeOptions
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    preventScroll = false,
  } = options;

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchEnd.current = null;
      touchStart.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScroll && touchStart.current) {
        const deltaX = Math.abs(e.targetTouches[0].clientX - touchStart.current.x);
        const deltaY = Math.abs(e.targetTouches[0].clientY - touchStart.current.y);

        // Prevent vertical scroll if horizontal swipe is dominant
        if (deltaX > deltaY) {
          e.preventDefault();
        }
      }

      touchEnd.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const handleTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;

      const deltaX = touchStart.current.x - touchEnd.current.x;
      const deltaY = touchStart.current.y - touchEnd.current.y;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if swipe is primarily horizontal or vertical
      if (absX > absY) {
        // Horizontal swipe
        if (absX > minSwipeDistance) {
          if (deltaX > 0 && onSwipeLeft) {
            onSwipeLeft();
          } else if (deltaX < 0 && onSwipeRight) {
            onSwipeRight();
          }
        }
      } else {
        // Vertical swipe
        if (absY > minSwipeDistance) {
          if (deltaY > 0 && onSwipeUp) {
            onSwipeUp();
          } else if (deltaY < 0 && onSwipeDown) {
            onSwipeDown();
          }
        }
      }

      touchStart.current = null;
      touchEnd.current = null;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: !preventScroll });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    elementRef,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance,
    preventScroll,
  ]);
}

/**
 * Hook for detecting edge swipes to open drawer from screen edge
 * Useful for opening mobile navigation from left edge
 *
 * @param options - Edge swipe configuration
 *
 * @example
 * useEdgeSwipe({
 *   onSwipeFromLeftEdge: () => openSidebar(),
 *   edgeDistance: 20
 * });
 */
export function useEdgeSwipe(options: {
  onSwipeFromLeftEdge?: () => void;
  onSwipeFromRightEdge?: () => void;
  edgeDistance?: number;
  minSwipeDistance?: number;
}) {
  const {
    onSwipeFromLeftEdge,
    onSwipeFromRightEdge,
    edgeDistance = 20,
    minSwipeDistance = 50,
  } = options;

  const touchStart = useRef<{ x: number; y: number; isEdgeSwipe: boolean } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const windowWidth = window.innerWidth;

      // Check if touch started near left or right edge
      const isLeftEdge = x < edgeDistance;
      const isRightEdge = x > windowWidth - edgeDistance;

      if (isLeftEdge || isRightEdge) {
        touchStart.current = {
          x,
          y,
          isEdgeSwipe: true,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || !touchStart.current.isEdgeSwipe) return;

      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - touchStart.current.x;

      // Left edge swipe right (open from left)
      if (
        touchStart.current.x < edgeDistance &&
        deltaX > minSwipeDistance &&
        onSwipeFromLeftEdge
      ) {
        onSwipeFromLeftEdge();
      }

      // Right edge swipe left (open from right)
      if (
        touchStart.current.x > window.innerWidth - edgeDistance &&
        deltaX < -minSwipeDistance &&
        onSwipeFromRightEdge
      ) {
        onSwipeFromRightEdge();
      }

      touchStart.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeFromLeftEdge, onSwipeFromRightEdge, edgeDistance, minSwipeDistance]);
}
