"use client";

import { useEffect, useRef, useMemo } from "react";
import { sanitizeBugDescription } from "@/lib/sanitize";
import Lightbox from "@/components/ui/Lightbox";

interface HtmlContentProps {
  html: string;
}

export default function HtmlContent({ html }: HtmlContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML once on mount/update to prevent XSS attacks
  const sanitizedHtml = useMemo(() => sanitizeBugDescription(html), [html]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Find all img tags in the HTML content
    const images = containerRef.current.querySelectorAll("img");

    images.forEach((img) => {
      // Transform file_download.php URLs to Next.js API endpoints
      if (img.src.includes("file_download.php")) {
        const url = new URL(img.src, window.location.origin);
        const fileId = url.searchParams.get("file_id");
        const type = url.searchParams.get("type") || "bug";

        if (fileId) {
          // Replace with Next.js API endpoint
          img.src = `/api/files/${fileId}?type=${type}&show_inline=1`;
        }
      }

      // Create a wrapper for the lightbox
      const wrapper = document.createElement("span");
      wrapper.style.display = "inline-block";

      // Clone the image attributes
      const src = img.src;
      const alt = img.alt || "Image";
      const className = img.className;
      const style = img.getAttribute("style") || "";

      // Replace the img with our Lightbox-enabled version
      img.style.cursor = "pointer";
      img.title = "Click to expand";

      img.onclick = (e) => {
        e.preventDefault();
        // Create a temporary container for the lightbox
        const lightboxContainer = document.createElement("div");
        lightboxContainer.id = "temp-lightbox";
        document.body.appendChild(lightboxContainer);

        // Render a full-screen lightbox
        const lightbox = document.createElement("div");
        lightbox.className = "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90";
        lightbox.onclick = () => {
          document.body.removeChild(lightboxContainer);
          document.body.style.overflow = "unset";
        };

        // Add image
        const lightboxImg = document.createElement("img");
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        lightboxImg.className = "max-w-full max-h-full";
        lightboxImg.onclick = (e) => e.stopPropagation();

        // Add close button
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "✕";
        closeBtn.className = "absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center text-2xl";
        closeBtn.onclick = () => {
          document.body.removeChild(lightboxContainer);
          document.body.style.overflow = "unset";
        };

        lightbox.appendChild(closeBtn);
        lightbox.appendChild(lightboxImg);
        lightboxContainer.appendChild(lightbox);
        document.body.style.overflow = "hidden";

        // Handle escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            document.body.removeChild(lightboxContainer);
            document.body.style.overflow = "unset";
            document.removeEventListener("keydown", handleEscape);
          }
        };
        document.addEventListener("keydown", handleEscape);
      };
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}