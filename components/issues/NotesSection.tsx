"use client";

import { useState, useEffect, useCallback } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import Editor from "@/components/wysiwyg/Editor";
import { logger } from "@/lib/logger";

interface Note {
  id: number;
  text: string;
  reporter: string;
  reporter_id: number;
  date_submitted: number;
  last_modified: number;
}

export default function NotesSection({ issueId, currentUserId }: { issueId: number; currentUserId: number }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load notes
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      logger.error("Failed to load notes:", err);
    }
  }, [issueId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

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
        await fetchNotes();
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
        await fetchNotes();
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
        await fetchNotes();
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

  function startEditing(note: Note) {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  }

  function cancelEditing() {
    setEditingNoteId(null);
    setEditingText("");
  }

  return (
    <div className="bg-white border rounded p-6 space-y-4">
      <h2 className="text-xl font-semibold">Notes</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add new note form */}
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

      {/* Notes list */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="border rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <strong>{note.reporter}</strong> &quot;{" "}
                {new Date(note.date_submitted * 1000).toLocaleString()}
                {note.last_modified !== note.date_submitted && " (edited)"}
              </div>
              {note.reporter_id === currentUserId && (
                <div className="flex gap-2">
                  {editingNoteId !== note.id && (
                    <>
                      <button
                        onClick={() => startEditing(note)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {editingNoteId === note.id ? (
              <div className="space-y-2">
                <Editor value={editingText} onChange={setEditingText} />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditNote(note.id)}
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
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.text) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}