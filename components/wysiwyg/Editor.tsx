// /components/wysiwyg/Editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import React from "react";

export default function Editor({ value, onChange }: { value?: string; onChange?: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Type here..." }),
    ],
    content: value ?? "",
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    }
  });

  return (
    <div className="border rounded-md p-2">
      <div className="flex gap-2 mb-2">
        <button className="text-sm border px-2 py-1 rounded" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
        <button className="text-sm border px-2 py-1 rounded" onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
        <button className="text-sm border px-2 py-1 rounded" onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
