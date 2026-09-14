"use client";

import * as React from "react";
import { FileUp, Mic, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./primitives";

/**
 * Upload control used by every ingest dialog.
 *
 * The browse button opens a real file picker and selected files are listed
 * with a way to remove them, so the control is never an inert decoration.
 */
export function FileDropzone({
  hint,
  accept,
  multiple = true,
  className,
  onFilesChange,
}: {
  hint?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
  onFilesChange?: (files: File[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragging, setDragging] = React.useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const next = multiple ? [...files, ...Array.from(incoming)] : Array.from(incoming).slice(0, 1);
    setFiles(next);
    onFilesChange?.(next);
  };

  const remove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange?.(next);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-accent bg-accent-subtle" : "border-border bg-surface-sunken",
        )}
      >
        <FileUp className="h-6 w-6 text-foreground-subtle" />
        <p className="text-sm text-foreground">Drop files here or browse</p>
        {hint && <p className="max-w-sm text-xs text-foreground-muted">{hint}</p>}
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            addFiles(e.target.files);
            // Reset so selecting the same file twice still fires a change.
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5"
            >
              <span className="min-w-0 truncate text-xs text-foreground">{file.name}</span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusPill>{formatSize(file.size)}</StatusPill>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded p-0.5 text-foreground-subtle transition-colors hover:bg-surface-hover hover:text-danger"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Voice capture toggle for complaint intake. Keeps a visible elapsed timer so
 * the citizen and the officer can both see that recording is in progress.
 */
export function RecordButton({
  onStop,
  className,
}: {
  onStop?: (seconds: number) => void;
  className?: string;
}) {
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const toggle = () => {
    if (recording) {
      setRecording(false);
      onStop?.(seconds);
      setSeconds(0);
    } else {
      setSeconds(0);
      setRecording(true);
    }
  };

  return (
    <Button
      variant={recording ? "destructive" : "outline"}
      size="sm"
      onClick={toggle}
      className={className}
    >
      {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      {recording ? `Stop · ${format(seconds)}` : "Record"}
    </Button>
  );
}

function format(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
