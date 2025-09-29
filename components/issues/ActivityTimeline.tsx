"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTrash, faFile, faUpload, faComment } from "@fortawesome/free-solid-svg-icons";
import Editor from "@/components/wysiwyg/Editor";
import Lightbox from "@/components/ui/Lightbox";
import HtmlContent from "@/components/issues/HtmlContent";

interface Note {
  id: number;
  text: string;
  reporter: string;
  reporter_id: number;
  date_submitted: number;
  last_modified: number;
}

interface Attachment {
  id: number;
  filename: string;
  filesize: number;
  file_type: string;
  date_added: number;
  user_id: number;
  uploader: string;
}

type ActivityItem =
  | { type: "note"; date: number; data: Note }
  | { type: "attachment"; date: number; data: Attachment };

export default function ActivityTimeline({ issueId, currentUserId }: { issueId: number; currentUserId: number }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchActivities();
  }, [issueId]);

  async function fetchActivities() {
    try {
      const [notesRes, attachmentsRes] = await Promise.all([
        fetch(`/api/issues/${issueId}/notes`),
        fetch(`/api/issues/${issueId}/attachments`)
      ]);

      if (notesRes.ok && attachmentsRes.ok) {
        const notes = await notesRes.json();
        const attachments = await attachmentsRes.json();

        // Combine into activity items
        const noteActivities: ActivityItem[] = notes.map((note: Note) => ({
          type: "note" as const,
          date: note.date_submitted,
          data: note
        }));

        const attachmentActivities: ActivityItem[] = attachments.map((att: Attachment) => ({
          type: "attachment" as const,
          date: att.date_added,
          data: att
        }));

        // Combine and sort by date descending (newest first)
        const combined = [...noteActivities, ...attachmentActivities];
        combined.sort((a, b) => b.date - a.date);

        setActivities(combined);
      }
    } catch (err) {
      console.error("Failed to load activities:", err);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/issues/${issueId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote })
      });

      if (res.ok) {
        setNewNote("");
        await fetchActivities();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add note");
      }
    } catch (err) {
      setError("Failed to add note");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditNote(noteId: number) {
    if (!editingText.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/issues/${issueId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: editingText })
      });

      if (res.ok) {
        setEditingNoteId(null);
        setEditingText("");
        await fetchActivities();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update note");
      }
    } catch (err) {
      setError("Failed to update note");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteNote(noteId: number) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/issues/${issueId}/notes/${noteId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchActivities();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete note");
      }
    } catch (err) {
      setError("Failed to delete note");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/issues/${issueId}/attachments`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        await fetchActivities();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to upload file");
      }
    } catch (err) {
      setError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAttachment(fileId: number) {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    setError("");

    try {
      const res = await fetch(`/api/issues/${issueId}/attachments/${fileId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchActivities();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete attachment");
      }
    } catch (err) {
      setError("Failed to delete attachment");
    }
  }

  function startEditing(note: Note) {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  }

  function cancelEditing() {
    setEditingNoteId(null);
    setEditingText("");
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  function isImage(fileType: string): boolean {
    return fileType.startsWith("image/");
  }

  return (
    <div className="bg-white border rounded p-6 space-y-4">
      <h2 className="text-xl font-semibold">Activity</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add new note form */}
      <div className="border rounded p-4 space-y-2 bg-gray-50">
        <h3 className="font-semibold flex items-center gap-2">
          <FontAwesomeIcon icon={faComment} />
          Add Note
        </h3>
        <form onSubmit={handleAddNote} className="space-y-2">
          <Editor value={newNote} onChange={setNewNote} />
          <button
            type="submit"
            disabled={loading || !newNote.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add Note
          </button>
        </form>
      </div>

      {/* Upload file form */}
      <div className="border rounded p-4 space-y-2 bg-gray-50">
        <h3 className="font-semibold flex items-center gap-2">
          <FontAwesomeIcon icon={faUpload} />
          Upload Attachment
        </h3>
        <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faUpload} />
          {uploading ? "Uploading..." : "Choose File"}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Activity timeline */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No activity yet</p>
        ) : (
          activities.map((activity, index) => (
            <div key={`${activity.type}-${activity.type === "note" ? activity.data.id : activity.data.id}`} className="border rounded p-4 space-y-2">
              {activity.type === "note" ? (
                // Note item
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <FontAwesomeIcon icon={faComment} className="text-blue-500" />
                      <strong>{activity.data.reporter}</strong> added a note ·{" "}
                      {new Date(activity.data.date_submitted * 1000).toLocaleString()}
                      {activity.data.last_modified !== activity.data.date_submitted && " (edited)"}
                    </div>
                    {activity.data.reporter_id === currentUserId && (
                      <div className="flex gap-2">
                        {editingNoteId !== activity.data.id && (
                          <>
                            <button
                              onClick={() => startEditing(activity.data)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(activity.data.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {editingNoteId === activity.data.id ? (
                    <div className="space-y-2">
                      <Editor value={editingText} onChange={setEditingText} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditNote(activity.data.id)}
                          disabled={loading}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={loading}
                          className="border px-3 py-1 rounded text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <HtmlContent html={activity.data.text} />
                  )}
                </>
              ) : (
                // Attachment item
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faFile} className="text-gray-400" />
                      <div>
                        <div className="font-medium">{activity.data.filename}</div>
                        <div className="text-sm text-gray-600">
                          {formatFileSize(activity.data.filesize)} · {activity.data.uploader} ·{" "}
                          {new Date(activity.data.date_added * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/issues/${issueId}/attachments/${activity.data.id}`}
                        download={activity.data.filename}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50"
                        title="Download"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </a>
                      {activity.data.user_id === currentUserId && (
                        <button
                          onClick={() => handleDeleteAttachment(activity.data.id)}
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Display image inline if it's an image file */}
                  {isImage(activity.data.file_type) && (
                    <div className="mt-2">
                      <Lightbox
                        src={`/api/issues/${issueId}/attachments/${activity.data.id}`}
                        alt={activity.data.filename}
                        className="max-w-full h-auto rounded border"
                        style={{ maxHeight: "500px" }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}