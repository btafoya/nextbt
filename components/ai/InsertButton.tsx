"use client";

interface InsertButtonProps {
  content: string;
  fieldKey?: string;
  fieldLabel?: string;
  onInsert: (content: string, fieldKey?: string) => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export default function InsertButton({
  content,
  fieldKey,
  fieldLabel,
  onInsert,
  className = "",
}: InsertButtonProps) {
  const handleClick = () => {
    onInsert(content, fieldKey);
  };

  const label =
    fieldLabel ||
    (fieldKey
      ? fieldKey
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/^\w/, (c) => c.toUpperCase())
      : "Document");

  return (
    <button
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 rounded border border-stroke px-3 py-1.5 text-sm font-medium transition-all hover:bg-primary hover:text-white ${className}`}
    >
      <svg
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span>Insert to</span>
      <strong>{label}</strong>
      <svg
        className="h-3 w-3 transition-transform group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 5l7 7m0 0l-7 7m7-7H3"
        />
      </svg>
    </button>
  );
}