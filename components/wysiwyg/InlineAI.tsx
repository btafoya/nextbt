// /components/wysiwyg/InlineAI.tsx
"use client";

import React, { useState } from "react";
import WriterChat from "@/components/ai/WriterChat";

export default function InlineAI({
  onInsert,
  fieldKey,
  projectName,
}: {
  onInsert: (text: string) => void;
  fieldKey?: string;
  projectName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded border border-stroke px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary hover:text-white"
      >
        <span>✨</span>
        <span>AI Assistant</span>
      </button>

      {isOpen && (
        <WriterChat
          docType="issue"
          fieldKey={fieldKey}
          projectName={projectName}
          onInsert={onInsert}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
