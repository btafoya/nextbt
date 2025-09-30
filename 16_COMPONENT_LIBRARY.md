# 16 — Component Library & Design Specifications

## Component Architecture

**Base Components**: TailAdmin Free Next.js Admin Dashboard
**Custom Components**: NextBT-specific features
**Component Location**: `/components/`

```
/components
  /ui/               # TailAdmin base components
    Button.tsx
    Card.tsx
    Table.tsx
    Form/
      Input.tsx
      Select.tsx
      Textarea.tsx
    Modal.tsx
    Dropdown.tsx
  /layout/           # Layout components
    Sidebar.tsx
    Header.tsx
    Breadcrumb.tsx
  /wysiwyg/          # Rich text editor
    Editor.tsx
    InlineAI.tsx
    Toolbar.tsx
  /issues/           # Issue-specific components
    IssueCard.tsx
    IssueTable.tsx
    StatusBadge.tsx
    PriorityBadge.tsx
    IssueForm.tsx
  /notifications/    # Notification components
    NotificationBell.tsx
    NotificationPanel.tsx
    NotificationItem.tsx
  /forms/            # Form components
    FilterBar.tsx
    SearchForm.tsx
    IssueFilters.tsx
```

## Core UI Components (TailAdmin)

### Button Component
**File**: `/components/ui/Button.tsx`

```tsx
import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled = false,
  type = "button",
  className = ""
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 focus:ring-primary",
    secondary: "bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary",
    danger: "bg-meta-7 text-white hover:bg-meta-7/90 focus:ring-meta-7",
    ghost: "bg-transparent border border-stroke hover:bg-gray-2 focus:ring-primary"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
```

### Card Component
**File**: `/components/ui/Card.tsx`

```tsx
interface CardProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Card({ children, title, actions, className = "" }: CardProps) {
  return (
    <div className={`rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
      {(title || actions) && (
        <div className="border-b border-stroke px-4 py-4 dark:border-strokedark flex justify-between items-center">
          {title && <h3 className="font-medium text-black dark:text-white">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
```

### Table Component
**File**: `/components/ui/Table.tsx`

```tsx
interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T extends { id: number | string }>({
  data,
  columns,
  onRowClick,
  className = ""
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-4 font-medium text-black dark:text-white"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-stroke dark:border-strokedark ${
                onRowClick ? "cursor-pointer hover:bg-gray-2 dark:hover:bg-meta-4" : ""
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-4">
                  {col.render
                    ? col.render(item)
                    : (item as any)[col.key]?.toString() || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Issue Components

### StatusBadge Component
**File**: `/components/issues/StatusBadge.tsx`

```tsx
type Status = "new" | "assigned" | "in_progress" | "resolved" | "closed";

const statusConfig: Record<Status, { label: string; color: string }> = {
  new: { label: "New", color: "bg-meta-9 text-white" },
  assigned: { label: "Assigned", color: "bg-meta-6 text-white" },
  in_progress: { label: "In Progress", color: "bg-meta-8 text-white" },
  resolved: { label: "Resolved", color: "bg-meta-5 text-white" },
  closed: { label: "Closed", color: "bg-meta-1 text-white" }
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
```

### PriorityBadge Component
**File**: `/components/issues/PriorityBadge.tsx`

```tsx
type Priority = "low" | "normal" | "high" | "urgent" | "immediate";

const priorityConfig: Record<Priority, { label: string; color: string; icon: string }> = {
  low: { label: "Low", color: "border-meta-3 text-meta-3", icon: "↓" },
  normal: { label: "Normal", color: "border-meta-1 text-meta-1", icon: "—" },
  high: { label: "High", color: "border-meta-8 text-meta-8", icon: "↑" },
  urgent: { label: "Urgent", color: "bg-meta-7 text-white", icon: "↑↑" },
  immediate: { label: "Immediate", color: "bg-meta-7 text-white animate-pulse", icon: "⚠" }
};

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
  className?: string;
}

export function PriorityBadge({ priority, showLabel = true, className = "" }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const isFilled = priority === "urgent" || priority === "immediate";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium ${
      isFilled ? config.color : `border ${config.color}`
    } ${className}`}>
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
```

### IssueCard Component
**File**: `/components/issues/IssueCard.tsx`

```tsx
import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { Avatar } from "@/components/ui/Avatar";

interface Issue {
  id: number;
  summary: string;
  status: string;
  priority: string;
  assignee?: {
    id: number;
    name: string;
    avatar?: string;
  };
  project: string;
  updated: string;
}

interface IssueCardProps {
  issue: Issue;
  draggable?: boolean;
}

export function IssueCard({ issue, draggable = false }: IssueCardProps) {
  return (
    <div
      draggable={draggable}
      className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-lg transition-shadow"
    >
      <Link href={`/issues/${issue.id}`} className="block">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm text-meta-3 font-medium">#{issue.id}</span>
          <PriorityBadge priority={issue.priority as any} showLabel={false} />
        </div>

        <h4 className="font-medium text-black dark:text-white mb-3 line-clamp-2 hover:text-primary">
          {issue.summary}
        </h4>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {issue.assignee ? (
              <Avatar user={issue.assignee} size="sm" />
            ) : (
              <span className="text-sm text-bodydark">Unassigned</span>
            )}
          </div>
          <StatusBadge status={issue.status as any} />
        </div>

        <div className="mt-3 text-xs text-bodydark">
          {issue.project} • Updated {issue.updated}
        </div>
      </Link>
    </div>
  );
}
```

### IssueForm Component
**File**: `/components/issues/IssueForm.tsx`

```tsx
import { Editor } from "@/components/wysiwyg/Editor";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
import { Button } from "@/components/ui/Button";

interface IssueFormProps {
  initialData?: Partial<IssueFormData>;
  onSubmit: (data: IssueFormData) => Promise<void>;
  projects: { id: number; name: string }[];
  users: { id: number; name: string }[];
}

export function IssueForm({ initialData, onSubmit, projects, users }: IssueFormProps) {
  const [formData, setFormData] = React.useState({
    title: initialData?.title || "",
    projectId: initialData?.projectId || "",
    status: initialData?.status || "new",
    priority: initialData?.priority || "normal",
    assigneeId: initialData?.assigneeId || "",
    description: initialData?.description || "",
    stepsToReproduce: initialData?.stepsToReproduce || "",
    additionalInfo: initialData?.additionalInfo || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Title"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Brief description of the issue"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Project"
          required
          value={formData.projectId}
          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
          options={projects.map(p => ({ value: p.id.toString(), label: p.name }))}
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: "new", label: "New" },
            { value: "assigned", label: "Assigned" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" }
          ]}
        />

        <Select
          label="Priority"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          options={[
            { value: "low", label: "Low" },
            { value: "normal", label: "Normal" },
            { value: "high", label: "High" },
            { value: "urgent", label: "Urgent" },
            { value: "immediate", label: "Immediate" }
          ]}
        />

        <Select
          label="Assignee"
          value={formData.assigneeId}
          onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
          options={[
            { value: "", label: "Unassigned" },
            ...users.map(u => ({ value: u.id.toString(), label: u.name }))
          ]}
        />
      </div>

      <div>
        <label className="mb-2.5 block text-black dark:text-white">
          Description <span className="text-meta-1">*</span>
        </label>
        <Editor
          content={formData.description}
          onChange={(content) => setFormData({ ...formData, description: content })}
          placeholder="Detailed description of the issue"
        />
      </div>

      <div>
        <label className="mb-2.5 block text-black dark:text-white">
          Steps to Reproduce
        </label>
        <Editor
          content={formData.stepsToReproduce}
          onChange={(content) => setFormData({ ...formData, stepsToReproduce: content })}
          placeholder="How to reproduce this issue"
        />
      </div>

      <div>
        <label className="mb-2.5 block text-black dark:text-white">
          Additional Information
        </label>
        <Editor
          content={formData.additionalInfo}
          onChange={(content) => setFormData({ ...formData, additionalInfo: content })}
          placeholder="Any other relevant information"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="primary">
          {initialData ? "Update Issue" : "Create Issue"}
        </Button>
        <Button type="button" variant="ghost" href="/issues">
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

## WYSIWYG Components

### Editor Component
**File**: `/components/wysiwyg/Editor.tsx`

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Toolbar } from "./Toolbar";
import { InlineAI } from "./InlineAI";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  aiEnabled?: boolean;
}

export function Editor({ content, onChange, placeholder, aiEnabled = true }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  if (!editor) return null;

  return (
    <div className="rounded-sm border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
      <Toolbar editor={editor} />
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none"
        />
        {aiEnabled && <InlineAI editor={editor} />}
      </div>
    </div>
  );
}
```

### InlineAI Component
**File**: `/components/wysiwyg/InlineAI.tsx`

```tsx
"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/Button";
import { callOpenRouter } from "@/lib/ai/openrouter";

interface InlineAIProps {
  editor: Editor;
}

export function InlineAI({ editor }: InlineAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const quickActions = [
    { label: "Improve writing", prompt: "Improve the writing quality of this text" },
    { label: "Fix grammar", prompt: "Fix grammar and spelling errors" },
    { label: "Make shorter", prompt: "Make this text more concise" },
    { label: "Make more technical", prompt: "Make this text more technical and detailed" }
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );

    if (!selectedText) {
      alert("Please select some text first");
      return;
    }

    setLoading(true);
    try {
      const result = await callOpenRouter(customPrompt || prompt, selectedText);
      editor.chain().focus().insertContent(result).run();
      setIsOpen(false);
      setPrompt("");
    } catch (error) {
      console.error("AI error:", error);
      alert("Failed to generate AI response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-4 right-4 rounded-full bg-primary p-3 text-white shadow-lg hover:bg-primary/90 transition-colors"
        title="AI Assistant (Cmd+K)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-4 w-80 rounded-sm border border-stroke bg-white p-4 shadow-lg dark:border-strokedark dark:bg-boxdark">
          <h4 className="mb-3 font-medium text-black dark:text-white">AI Writing Assistant</h4>

          <div className="mb-4 space-y-2">
            <p className="text-sm text-bodydark">Quick Actions:</p>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleGenerate(action.prompt)}
                disabled={loading}
                className="w-full text-left rounded px-3 py-2 text-sm hover:bg-gray-2 dark:hover:bg-meta-4 transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Or type custom prompt..."
              className="w-full rounded border border-stroke px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-strokedark dark:bg-boxdark-2"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleGenerate()}
                disabled={loading || !prompt}
                variant="primary"
                size="sm"
              >
                {loading ? "Generating..." : "Generate"}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

## Notification Components

### NotificationBell Component
**File**: `/components/notifications/NotificationBell.tsx`

```tsx
"use client";

import { useState } from "react";
import { NotificationPanel } from "./NotificationPanel";

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 z-1 h-4 w-4 rounded-full bg-meta-7 flex items-center justify-center">
            <span className="text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && <NotificationPanel onClose={() => setIsOpen(false)} />}
    </div>
  );
}
```

## Component Usage Examples

### Issue List Page
```tsx
import { Table } from "@/components/ui/Table";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { PriorityBadge } from "@/components/issues/PriorityBadge";

export default function IssuesPage() {
  const columns = [
    { key: "id", label: "ID" },
    { key: "summary", label: "Title" },
    {
      key: "status",
      label: "Status",
      render: (issue) => <StatusBadge status={issue.status} />
    },
    {
      key: "priority",
      label: "Priority",
      render: (issue) => <PriorityBadge priority={issue.priority} />
    },
    { key: "assignee", label: "Assignee" },
    { key: "updated", label: "Updated" }
  ];

  return (
    <Card title="Issues" actions={<Button href="/issues/new">New Issue</Button>}>
      <Table
        data={issues}
        columns={columns}
        onRowClick={(issue) => router.push(`/issues/${issue.id}`)}
      />
    </Card>
  );
}
```

## Testing Guidelines

1. **Unit Tests**: Test component logic and state management
2. **Visual Tests**: Storybook stories for all components
3. **Accessibility Tests**: Automated a11y testing with jest-axe
4. **Interaction Tests**: Test user interactions with Testing Library