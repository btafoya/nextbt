"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTrash, faFile, faUpload } from "@fortawesome/free-solid-svg-icons";
import { logger } from "@/lib/logger";

interface Attachment {
  id: number;
  filename: string;
  filesize: number;
  file_type: string;
  date_added: number;
  user_id: number;
  uploader: string;
}

export default function AttachmentsSection({ issueId, currentUserId }: { issueId: number; currentUserId: number }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [issueId]);

  async function fetchAttachments() {
    try {
      const res = await fetch(`/api/issues/${issueId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (err) {
      logger.error("Failed to load attachments:", err);
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
        await fetchAttachments();
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

  async function handleDelete(fileId: number) {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    setError("");

    try {
      const res = await fetch(`/api/issues/${issueId}/attachments/${fileId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchAttachments();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete attachment");
      }
    } catch (err) {
      setError("Failed to delete attachment");
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Attachments</h2>
        <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faUpload} />
          {uploading ? "Uploading..." : "Upload File"}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No attachments yet</p>
      ) : (
        <div className="space-y-4">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="border rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faFile} className="text-gray-400" />
                  <div>
                    <div className="font-medium">{attachment.filename}</div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(attachment.filesize)} • {attachment.uploader} •{" "}
                      {new Date(attachment.date_added * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/issues/${issueId}/attachments/${attachment.id}`}
                    download={attachment.filename}
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50"
                    title="Download"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </a>
                  {attachment.user_id === currentUserId && (
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              </div>

              {/* Display image inline if it's an image file */}
              {isImage(attachment.file_type) && (
                <div className="mt-2">
                  <img
                    src={`/api/issues/${issueId}/attachments/${attachment.id}`}
                    alt={attachment.filename}
                    className="max-w-full h-auto rounded border"
                    style={{ maxHeight: "500px" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}