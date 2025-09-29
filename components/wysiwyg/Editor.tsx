// /components/wysiwyg/Editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Blockquote from "@tiptap/extension-blockquote";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import React, { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faCode,
  faHeading,
  faListUl,
  faListOl,
  faQuoteLeft,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faLink,
  faImage,
  faHighlighter
} from "@fortawesome/free-solid-svg-icons";

export default function Editor({ value, onChange }: { value?: string; onChange?: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        strike: false,
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Type here..." }),
      Image,
      Underline,
      Strike,
      Code,
      Blockquote,
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
    ],
    content: value ?? "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    }
  });

  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("bold") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("italic") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("underline") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("strike") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <FontAwesomeIcon icon={faStrikethrough} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("code") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <FontAwesomeIcon icon={faCode} />
        </button>

        <span className="border-r mx-1" />

        {/* Headings */}
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("heading", { level: 1 }) ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <FontAwesomeIcon icon={faHeading} /> 1
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <FontAwesomeIcon icon={faHeading} /> 2
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("heading", { level: 3 }) ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <FontAwesomeIcon icon={faHeading} /> 3
        </button>

        <span className="border-r mx-1" />

        {/* Lists */}
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("bulletList") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("orderedList") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <FontAwesomeIcon icon={faListOl} />
        </button>

        <span className="border-r mx-1" />

        {/* Block Elements */}
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("blockquote") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <FontAwesomeIcon icon={faQuoteLeft} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive("highlight") ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <FontAwesomeIcon icon={faHighlighter} />
        </button>

        <span className="border-r mx-1" />

        {/* Alignment */}
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive({ textAlign: "left" }) ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <FontAwesomeIcon icon={faAlignLeft} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive({ textAlign: "center" }) ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <FontAwesomeIcon icon={faAlignCenter} />
        </button>
        <button
          type="button"
          className={`text-sm border px-2 py-1 rounded ${editor.isActive({ textAlign: "right" }) ? "bg-blue-100" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <FontAwesomeIcon icon={faAlignRight} />
        </button>

        <span className="border-r mx-1" />

        {/* Links & Images */}
        <button
          type="button"
          className="text-sm border px-2 py-1 rounded"
          onClick={addLink}
          title="Insert Link"
        >
          <FontAwesomeIcon icon={faLink} />
        </button>
        <button
          type="button"
          className="text-sm border px-2 py-1 rounded"
          onClick={addImage}
          title="Insert Image"
        >
          <FontAwesomeIcon icon={faImage} />
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-2 prose max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
