"use client";

import { useEffect, useState, useRef } from "react";

interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  label?: string | null;
  createdAt: string;
  uploadedBy: { name: string };
}

interface AttachmentPanelProps {
  entityId: string;
  entityType: "project" | "issue" | "event";
  isGM: boolean;
}

function fileIcon(mime: string) {
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.endsWith(".csv")) return "📊";
  if (mime.includes("wordprocessingml") || mime.includes("msword")) return "📝";
  if (mime.includes("presentationml") || mime.includes("powerpoint")) return "📋";
  return "📎";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentPanel({ entityId, entityType, isGM }: AttachmentPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const paramKey = entityType === "project" ? "projectId" : entityType === "issue" ? "issueId" : "eventId";

  async function fetchAttachments() {
    setLoading(true);
    const res = await fetch(`/api/attachments?${paramKey}=${entityId}`);
    if (res.ok) {
      const data = await res.json();
      setAttachments(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open) fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append(paramKey, entityId);
    if (label.trim()) form.append("label", label.trim());
    const res = await fetch("/api/attachments", { method: "POST", body: form });
    if (res.ok) {
      const added = await res.json();
      setAttachments((prev) => [added, ...prev]);
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Upload failed");
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this attachment?")) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  const count = attachments.length;

  return (
    <div className="mt-2 border-t border-gray-200">
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 py-1"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? "▼" : "▶"}</span>
        <span>Attachments{!loading && open ? ` (${count})` : ""}</span>
      </button>

      {open && (
        <div className="pb-2 space-y-2">
          {/* Upload area — GM only */}
          {isGM && (
            <div className="flex flex-col gap-1 bg-gray-50 rounded p-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  className="text-xs flex-1 min-w-0"
                />
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50 whitespace-nowrap"
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional label / description"
                className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )}

          {/* List */}
          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : count === 0 ? (
            <p className="text-xs text-gray-400 italic">No attachments yet.</p>
          ) : (
            <ul className="space-y-1">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-xs">
                  <span className="text-base leading-none">{fileIcon(a.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline truncate block"
                    >
                      {a.filename}
                    </a>
                    {a.label && <p className="text-gray-500 truncate">{a.label}</p>}
                    <p className="text-gray-400">
                      {formatSize(a.size)} · {a.uploadedBy.name} · {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isGM && (
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="text-red-400 hover:text-red-600 shrink-0"
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
