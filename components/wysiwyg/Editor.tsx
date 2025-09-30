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
import React, { useCallback, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WriterChat from "@/components/ai/WriterChat";
import PromptBar from "@/components/ai/PromptBar";
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

interface EditorProps {
  value?: string;
  onChange?: (html: string) => void;
  fieldKey?: string;
  projectName?: string;
  issueCategory?: string;
  enableAI?: boolean;
}

export default function Editor({
  value,
  onChange,
  fieldKey,
  projectName,
  issueCategory,
  enableAI = true
}: EditorProps) {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [initialAction, setInitialAction] = useState<{ action: string; customPrompt?: string } | null>(null);

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
    },
    onSelectionUpdate({ editor }) {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ");
      setSelectedText(text);
    },
  });

  // Sync editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if the content is actually different to avoid infinite loops
      if (currentContent !== value) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  const addImage = useCallback(() => {
    // Create a modal dialog for image insertion
    const dialog = document.createElement('div');
    dialog.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';

    const content = document.createElement('div');
    content.style.cssText = 'background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%;';

    // Create dialog elements safely without innerHTML
    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 600;';
    title.textContent = 'Insert Image';

    const urlContainer = document.createElement('div');
    urlContainer.style.marginBottom = '16px';
    const urlLabel = document.createElement('label');
    urlLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 500;';
    urlLabel.textContent = 'From URL:';
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.id = 'image-url';
    urlInput.placeholder = 'https://example.com/image.jpg';
    urlInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;';
    urlContainer.appendChild(urlLabel);
    urlContainer.appendChild(urlInput);

    const fileContainer = document.createElement('div');
    fileContainer.style.marginBottom = '16px';
    const fileLabel = document.createElement('label');
    fileLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 500;';
    fileLabel.textContent = 'Or upload file:';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'image-file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;';
    fileContainer.appendChild(fileLabel);
    fileContainer.appendChild(fileInput);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;';
    const insertBtn = document.createElement('button');
    insertBtn.id = 'insert-btn';
    insertBtn.textContent = 'Insert';
    insertBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 4px; background: #2563eb; color: white; cursor: pointer;';
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(insertBtn);

    // Assemble dialog
    content.appendChild(title);
    content.appendChild(urlContainer);
    content.appendChild(fileContainer);
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);

    const cleanup = () => document.body.removeChild(dialog);

    cancelBtn.onclick = cleanup;
    dialog.onclick = (e) => { if (e.target === dialog) cleanup(); };

    insertBtn.onclick = async () => {
      const url = urlInput.value.trim();
      const file = fileInput.files?.[0];

      if (url) {
        editor?.chain().focus().setImage({ src: url }).run();
        cleanup();
      } else if (file) {
        // Convert file to base64 data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          editor?.chain().focus().setImage({ src: dataUrl }).run();
          cleanup();
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please enter a URL or select a file');
      }
    };

    // Allow Enter key to insert from URL field
    urlInput.onkeydown = (e) => { if (e.key === 'Enter') insertBtn.click(); };
    urlInput.focus();
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleAIAction = useCallback((action: string, customPrompt?: string) => {
    setInitialAction({ action, customPrompt });
    setIsAIOpen(true);
  }, []);

  const handleAIInsert = useCallback((content: string, targetFieldKey?: string) => {
    if (editor && targetFieldKey === fieldKey) {
      editor.chain().focus().insertContent(content).run();
    }
  }, [editor, fieldKey]);

  const handleAIReplace = useCallback((content: string, targetFieldKey?: string) => {
    if (editor && targetFieldKey === fieldKey) {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().deleteSelection().insertContent(content).run();
      } else {
        // Replace all content if nothing selected
        editor.chain().focus().setContent(content).run();
      }
    }
  }, [editor, fieldKey]);

  if (!editor) return null;

  return (
    <div className="border rounded-md">
      {/* AI Prompt Bar */}
      {enableAI && (
        <PromptBar
          onAction={handleAIAction}
          selectedText={selectedText}
          fieldKey={fieldKey}
          disabled={false}
        />
      )}

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

        {/* AI Assistant Toggle */}
        {enableAI && (
          <>
            <span className="border-r mx-1" />
            <button
              type="button"
              className={`text-sm border px-2 py-1 rounded ${isAIOpen ? "bg-blue-100" : ""}`}
              onClick={() => setIsAIOpen(!isAIOpen)}
              title="AI Writing Assistant"
            >
              <span>✨</span> AI
            </button>
          </>
        )}
      </div>

      {/* Editor Content */}
      <div className="p-2 prose max-w-none">
        <EditorContent editor={editor} />
      </div>

      {/* AI Writer Chat Panel */}
      {enableAI && isAIOpen && (
        <WriterChat
          docType="issue"
          fieldKey={fieldKey}
          projectName={projectName}
          issueCategory={issueCategory}
          onInsert={handleAIInsert}
          onReplace={handleAIReplace}
          selectedText={selectedText}
          isOpen={isAIOpen}
          onClose={() => {
            setIsAIOpen(false);
            setInitialAction(null);
          }}
          initialAction={initialAction}
          currentContent={editor?.getHTML() || ""}
        />
      )}
    </div>
  );
}
