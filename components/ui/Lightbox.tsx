"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSearchPlus, faSearchMinus } from "@fortawesome/free-solid-svg-icons";

interface LightboxProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Lightbox({ src, alt, className, style }: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setScale(1);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "+") {
      handleZoomIn();
    } else if (e.key === "-") {
      handleZoomOut();
    }
  };

  return (
    <>
      {/* Thumbnail image */}
      <img
        src={src}
        alt={alt}
        className={`${className} cursor-pointer hover:opacity-80 transition-opacity`}
        style={style}
        onClick={() => setIsOpen(true)}
        title="Click to expand"
      />

      {/* Lightbox modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center transition-colors z-10"
            title="Close (Esc)"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
              title="Zoom out (-)"
            >
              <FontAwesomeIcon icon={faSearchMinus} size="lg" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
              title="Zoom in (+)"
            >
              <FontAwesomeIcon icon={faSearchPlus} size="lg" />
            </button>
            <div className="text-white bg-black bg-opacity-50 rounded-full px-4 h-12 flex items-center justify-center">
              {Math.round(scale * 100)}%
            </div>
          </div>

          {/* Image container */}
          <div
            className="relative max-w-full max-h-full overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-none transition-transform duration-200"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center"
              }}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
            Press Esc to close • +/- to zoom • Click outside to close
          </div>
        </div>
      )}
    </>
  );
}