"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface WriterChatProps {
  docType: "issue" | "task" | "note";
  docId?: string;
  fieldKey?: string;
  projectName?: string;
  issueCategory?: string;
  onInsert?: (content: string, fieldKey?: string) => void;
  onReplace?: (content: string, fieldKey?: string) => void;
  selectedText?: string;
  isOpen?: boolean;
  onClose?: () => void;
  initialAction?: { action: string; customPrompt?: string } | null;
  currentContent?: string;
}

export default function WriterChat({
  docType,
  docId,
  fieldKey,
  projectName,
  issueCategory,
  onInsert,
  onReplace,
  selectedText,
  isOpen = true,
  onClose,
  initialAction,
  currentContent,
}: WriterChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasProcessedAction, setHasProcessedAction] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle selected text
  useEffect(() => {
    if (selectedText && isOpen && !initialAction) {
      setInput(`Please help me improve this text:\n\n"${selectedText}"`);
    }
  }, [selectedText, isOpen, initialAction]);

  // Process initial action
  useEffect(() => {
    if (initialAction && isOpen && !hasProcessedAction) {
      const processAction = async () => {
        setHasProcessedAction(true);

        let prompt = "";
        const content = currentContent || "";

        switch (initialAction.action) {
          case "improve":
            if (content) {
              prompt = `Please improve the following ${fieldKey || "text"} to make it more professional and clear:\n\n${content}`;
            } else {
              prompt = `Please provide suggestions for writing a professional ${fieldKey || "description"} for this ${docType}.`;
            }
            break;

          case "examples":
            prompt = `Please provide 3 good examples of ${fieldKey || "descriptions"} for a ${docType} that I can use as reference.`;
            break;

          case "tighten":
            prompt = `Please make this text more concise while keeping the key information:\n\n${selectedText || content}`;
            break;

          case "friendlier":
            prompt = `Please rewrite this in a friendlier, more approachable tone:\n\n${selectedText || content}`;
            break;

          case "formal":
            prompt = `Please rewrite this using formal technical language:\n\n${selectedText || content}`;
            break;

          case "plainEnglish":
            prompt = `Please simplify this text to plain English, avoiding jargon:\n\n${selectedText || content}`;
            break;

          case "summarize":
            prompt = `Please create a concise summary of the following:\n\n${selectedText || content}`;
            break;

          case "bulletize":
            prompt = `Please convert the following text into clear bullet points:\n\n${selectedText || content}`;
            break;

          case "expand":
            prompt = `Please expand on this text with more detail and explanation:\n\n${selectedText || content}`;
            break;

          case "risks":
            prompt = `Please identify potential issues or concerns in the following text:\n\n${selectedText || content}`;
            break;

          case "suggest":
            if (initialAction.customPrompt) {
              prompt = `Please generate professional content for the ${initialAction.customPrompt} section of this ${docType}.`;
            }
            break;

          default:
            if (initialAction.customPrompt) {
              prompt = initialAction.customPrompt;
            }
            break;
        }

        if (prompt) {
          handleSendWithPrompt(prompt);
        }
      };

      processAction();
    }
  }, [
    initialAction,
    isOpen,
    hasProcessedAction,
    currentContent,
    selectedText,
    fieldKey,
    docType,
  ]);

  // Helper function to send with a specific prompt
  const handleSendWithPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: promptText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage.content },
          ],
          context: {
            docType,
            docId,
            fieldKey,
            projectName,
            issueCategory,
            highlightedText: selectedText,
            tone: "neutral",
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantMessage.content += parsed.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: assistantMessage.content }
                        : m
                    )
                  );
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("AI chat error:", error);
      alert("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    handleSendWithPrompt(input);
  };

  // Convert markdown-style content to HTML for TipTap editor
  const convertToHTML = (content: string): string => {
    let html = content;

    // Convert markdown-style formatting to HTML
    // Bold: **text** or __text__ -> <strong>text</strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

    // Italic: *text* or _text_ -> <em>text</em>
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

    // Code: `code` -> <code>code</code>
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headings: ## text -> <h2>text</h2>
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Unordered lists: - item or * item -> <ul><li>item</li></ul>
    html = html.replace(/^[\-\*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

    // Ordered lists: 1. item -> <ol><li>item</li></ol>
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      // Only wrap in <ol> if not already wrapped in <ul>
      if (!match.includes("<ul>")) {
        return `<ol>${match}</ol>`;
      }
      return match;
    });

    // Line breaks: double newline -> <p>
    html = html.replace(/\n\n+/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");

    // Wrap in paragraph if not already structured
    if (!html.match(/^<[huo]/)) {
      html = `<p>${html}</p>`;
    }

    return html;
  };

  const handleCopy = (content: string, id: string) => {
    // Copy as HTML to preserve formatting
    const html = convertToHTML(content);

    // Copy both plain text and HTML to clipboard
    const clipboardItem = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([content], { type: "text/plain" }),
    });

    navigator.clipboard.write([clipboardItem]).catch(() => {
      // Fallback to plain text if ClipboardItem not supported
      navigator.clipboard.writeText(content);
    });

    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (content: string) => {
    if (onInsert) {
      const html = convertToHTML(content);
      onInsert(html, fieldKey);
    }
  };

  const handleReplace = (content: string) => {
    if (onReplace) {
      const html = convertToHTML(content);
      onReplace(html, fieldKey);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-stroke bg-white shadow-lg dark:bg-boxdark">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stroke p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="font-semibold">AI Writing Assistant</h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-meta-4"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Context Bar */}
      {(docType || fieldKey) && (
        <div className="border-b border-stroke bg-gray-50 px-4 py-2 text-sm dark:bg-meta-4">
          <div className="flex items-center gap-2 text-bodydark">
            <span>📄</span>
            <span className="capitalize">{docType}</span>
            {fieldKey && (
              <>
                <span>›</span>
                <span className="capitalize">
                  {fieldKey.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="py-8 text-center text-bodydark">
            <span className="mb-4 block text-4xl opacity-50">💬</span>
            <p className="text-sm">Start a conversation to get AI assistance</p>
            <p className="mt-2 text-xs">
              I can help you draft, refine, and improve your {docType}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "border border-stroke bg-gray-50 dark:bg-meta-4"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  {message.role === "assistant" && (
                    <div className="mt-2 flex gap-2 border-t border-stroke pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(message.content, message.id)}
                        className="rounded px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-boxdark"
                      >
                        {copiedId === message.id ? "✓ Copied" : "📋 Copy"}
                      </button>
                      {onInsert && (
                        <button
                          type="button"
                          onClick={() => handleInsert(message.content)}
                          className="rounded px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-boxdark"
                        >
                          📝 Insert
                        </button>
                      )}
                      {onReplace && (
                        <button
                          type="button"
                          onClick={() => handleReplace(message.content)}
                          className="rounded px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-boxdark"
                        >
                          🔄 Replace
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-stroke bg-gray-50 p-3 dark:bg-meta-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-stroke p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask for help with your ${docType}...`}
            className="min-h-[80px] flex-1 resize-none rounded-lg border border-stroke p-2 text-sm focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-bodydark">
          AI suggestions require review. Press Enter to send, Shift+Enter for
          new line.
        </p>
      </div>
    </div>
  );
}