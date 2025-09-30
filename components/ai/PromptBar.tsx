"use client";

interface PromptBarProps {
  onAction: (action: string, customPrompt?: string) => void;
  selectedText?: string;
  fieldKey?: string;
  disabled?: boolean;
}

const quickActions = [
  {
    id: "tighten",
    label: "Tighten",
    tooltip: "Make text more concise",
    icon: "⚡",
  },
  {
    id: "friendlier",
    label: "Friendlier",
    tooltip: "Make tone more approachable",
    icon: "✨",
  },
  {
    id: "formal",
    label: "Formal",
    tooltip: "Use formal technical language",
    icon: "🎯",
  },
  {
    id: "plainEnglish",
    label: "Simplify",
    tooltip: "Convert to plain English",
    icon: "📝",
  },
  {
    id: "summarize",
    label: "Summarize",
    tooltip: "Create a summary",
    icon: "📄",
  },
  {
    id: "bulletize",
    label: "Bullets",
    tooltip: "Convert to bullet points",
    icon: "•",
  },
  {
    id: "expand",
    label: "Expand",
    tooltip: "Add more detail",
    icon: "📖",
  },
  {
    id: "risks",
    label: "Find Issues",
    tooltip: "Identify potential problems",
    icon: "⚠️",
  },
];

const fieldSuggestions = [
  { field: "description", label: "Generate Description" },
  { field: "steps_to_reproduce", label: "Write Steps" },
  { field: "additional_information", label: "Add Tech Details" },
  { field: "summary", label: "Generate Summary" },
  { field: "note", label: "Draft Note" },
  { field: "expected_result", label: "Expected Result" },
  { field: "actual_result", label: "Actual Result" },
];

export default function PromptBar({
  onAction,
  selectedText,
  fieldKey,
  disabled = false,
}: PromptBarProps) {
  const hasSelection = !!selectedText && selectedText.trim().length > 0;
  const relevantSuggestion = fieldKey
    ? fieldSuggestions.find((s) => s.field === fieldKey)
    : null;

  return (
    <div className="border-b border-stroke bg-white dark:bg-boxdark">
      <div className="px-4 py-2">
        {/* Quick Actions - Show when text is selected */}
        {hasSelection && (
          <div className="mb-2">
            <p className="mb-2 text-xs text-bodydark">
              Quick Actions for Selected Text:
            </p>
            <div className="flex flex-wrap gap-1">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onAction(action.id)}
                  disabled={disabled}
                  title={action.tooltip}
                  className="inline-flex items-center gap-1 rounded border border-stroke px-2 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Field Suggestions - Show when in a specific field */}
        {fieldKey && !hasSelection && (
          <div>
            <p className="mb-2 text-xs text-bodydark">
              Suggestions for this field:
            </p>
            <div className="flex flex-wrap gap-2">
              {relevantSuggestion && (
                <button
                  type="button"
                  onClick={() => onAction("suggest", relevantSuggestion.field)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded border border-stroke px-2 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-white"
                >
                  <span>#</span>
                  {relevantSuggestion.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => onAction("improve", fieldKey)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded border border-stroke px-2 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-white"
              >
                <span>✨</span>
                Improve Current Text
              </button>
              <button
                type="button"
                onClick={() => onAction("examples", fieldKey)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded border border-stroke px-2 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-white"
              >
                <span>📝</span>
                Show Examples
              </button>
            </div>
          </div>
        )}

        {/* General Actions - Always visible */}
        {!hasSelection && !fieldKey && (
          <div>
            <p className="mb-2 text-xs text-bodydark">Generate content:</p>
            <div className="flex flex-wrap gap-1">
              {fieldSuggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion.field}
                  type="button"
                  onClick={() => onAction("suggest", suggestion.field)}
                  disabled={disabled}
                  className="rounded border border-stroke px-2 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-white"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}