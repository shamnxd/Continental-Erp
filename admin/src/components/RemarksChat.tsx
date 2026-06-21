import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, X, Reply, FileText, Image } from "lucide-react";
import { Remark, RemarkEntityType } from "../interfaces/remark.interface";
import { getRemarksApi, addRemarkApi } from "../api/remark.api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface Props {
  entityType: RemarkEntityType;
  entityId: string;
  disabled?: boolean;
  layout?: "split" | "stacked";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarColor(name: string): string {
  const colors = [
    "bg-pink-600",
    "bg-violet-600",
    "bg-blue-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-teal-600",
    "bg-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffHrs < 48) return "Yesterday " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4 shrink-0" />;
  return <FileText className="h-4 w-4 shrink-0" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RemarksChat({ entityType, entityId, disabled = false, layout = "split" }: Props) {
  const isSplit = layout === "split";
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Remark | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const remarksLengthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRemarks = useCallback(async () => {
    if (!entityId) return;
    try {
      const res = await getRemarksApi(entityType, entityId);
      if (res.success) setRemarks(res.data);
    } catch {
      // silently ignore load errors
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    setLoading(true);
    loadRemarks();
  }, [loadRemarks]);

  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      const isInitial = remarksLengthRef.current === 0;
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isInitial ? "auto" : "smooth"
      });
      remarksLengthRef.current = remarks.length;
    }
  }, [remarks, loading]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    setSending(true);
    setError(null);
    try {
      const res = await addRemarkApi(entityType, entityId, text.trim(), replyTo?.id, file ?? undefined);
      if (res.success) {
        setRemarks((prev) => [...prev, res.data]);
        setText("");
        setFile(null);
        setReplyTo(null);
      }
    } catch {
      setError("Failed to send remark. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const remarkById = (id: string) => remarks.find((r) => r.id === id);

  return (
    <div className={`remarks-chat-container flex flex-col ${isSplit ? "xl:flex-row" : ""} gap-0 h-[calc(100vh-18rem)] ${isSplit ? "xl:h-[calc(100vh-16rem)]" : ""} min-h-[450px] rounded-xl border border-border overflow-hidden bg-card`}>
      {/* ── Chat Timeline (Left Panel on Desktop / Top Scrollable on Mobile) ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${isSplit ? "xl:w-2/3 xl:border-r xl:border-border" : ""}`}>
        <div className="px-5 py-3 border-b border-border bg-muted/40 shrink-0">
          <p className="text-sm font-semibold text-foreground">
            Remarks
            {remarks.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {remarks.length} {remarks.length === 1 ? "message" : "messages"}
              </span>
            )}
          </p>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground animate-pulse">Loading…</div>
            </div>
          ) : remarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No remarks yet.
                <br />
                <span className="text-xs">Be the first to add one.</span>
              </p>
            </div>
          ) : (
            remarks.map((remark) => {
              const parent = remark.parentRemarkId ? remarkById(remark.parentRemarkId) : null;
              return (
                <div key={remark.id} className="flex gap-3 group">
                  {/* Avatar */}
                  <div
                    className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5 ${avatarColor(remark.user)}`}
                  >
                    {initials(remark.user)}
                  </div>

                  {/* Bubble */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{remark.user}</span>
                      <time className="text-[11px] text-muted-foreground">{formatTime(remark.date)}</time>
                    </div>

                    {/* Reply quote */}
                    {parent && (
                      <div className="mb-2 pl-3 border-l-2 border-pink-500 rounded">
                        <p className="text-xs text-muted-foreground font-medium">{parent.user}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{parent.text}</p>
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-xl rounded-tl-sm px-4 py-2.5 inline-block max-w-full break-words">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{remark.text}</p>

                      {/* Attachments */}
                      {(remark.attachments ?? []).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {remark.attachments!.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-500 hover:underline transition-colors"
                            >
                              <FileIcon mimeType={att.mimeType} />
                              <span className="truncate max-w-[200px]">{att.name}</span>
                              <span className="text-muted-foreground shrink-0">({formatFileSize(att.size)})</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reply button */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => setReplyTo(remark)}
                        className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-pink-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Compose Area (Right Panel on Desktop / Bottom Bar on Mobile) ── */}
      <div className={`w-full shrink-0 flex flex-col bg-slate-50/50 dark:bg-slate-900/40 border-t border-border p-3 ${isSplit ? "xl:p-0 xl:gap-0 xl:w-1/3 xl:border-t-0" : ""} gap-2`}>
        {/* Compose Header (Desktop Only) */}
        {isSplit && (
          <div className="px-5 py-3 border-b border-border bg-muted/40 shrink-0 hidden xl:block">
            <p className="text-sm font-semibold text-foreground">Compose Message</p>
          </div>
        )}

        {/* Compose Content wrapper */}
        <div className={`flex flex-col gap-2 ${isSplit ? "xl:p-4" : ""}`}>
          {/* Reply strip */}
          {replyTo && (
            <div className="flex items-start gap-2 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg px-3 py-1.5 shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-pink-700 dark:text-pink-400">{replyTo.user}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{replyTo.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* File preview */}
          {file && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shrink-0">
              <FileText className="h-4 w-4 text-pink-600 shrink-0" />
              <span className="text-xs truncate flex-1 text-foreground">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Text Input & Buttons */}
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Type your remark…  (Enter to send, Shift+Enter for new line)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || sending}
              rows={2}
              className={`resize-none text-xs bg-background min-h-[60px] ${isSplit ? "xl:h-[240px]" : "h-[80px]"}`}
            />

            {error && <p className="text-[10px] text-red-500 shrink-0">{error}</p>}

            <div className="flex items-center justify-between gap-2 shrink-0">
              {/* Attach button */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={disabled || sending}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground px-3 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || sending}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach
              </Button>

              {/* Send button */}
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs bg-pink-700 hover:bg-pink-805 text-white font-semibold px-4 shrink-0"
                onClick={handleSend}
                disabled={disabled || sending || (!text.trim() && !file)}
              >
                {sending ? (
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
