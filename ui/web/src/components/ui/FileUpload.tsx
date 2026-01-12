"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, X, File, Image, Video, Mic, FileText, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toastStore";

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'any';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  fileType?: FileType;
  onUpload: (files: File[]) => Promise<void> | void;
  onRemove?: (file: File) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  existingFiles?: Array<{ name: string; url?: string; size?: string }>;
}

const fileTypeIcons = {
  image: Image,
  video: Video,
  audio: Mic,
  document: FileText,
  any: File,
};

const fileTypeAccept = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  document: '.pdf,.doc,.docx,.txt',
  any: '*/*',
};

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10,
  fileType = 'any',
  onUpload,
  onRemove,
  disabled = false,
  label,
  hint,
  className,
  existingFiles = [],
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = fileTypeIcons[fileType];
  const acceptType = accept || fileTypeAccept[fileType];

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.warning("File Size Limit", `Some files exceed ${maxSize}MB limit`);
      return;
    }

    const newFiles = multiple ? [...files, ...selectedFiles] : selectedFiles;
    setFiles(newFiles);

    // Create previews for images
    if (fileType === 'image') {
      const newPreviews: Record<string, string> = {};
      for (const file of selectedFiles) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews[file.name] = reader.result as string;
            setPreviews(prev => ({ ...prev, ...newPreviews }));
          };
          reader.readAsDataURL(file);
        }
      }
    }

    // Auto-upload if onUpload is provided
    if (onUpload) {
      setUploading(true);
      try {
        await onUpload(selectedFiles);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error("Upload Failed", "Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemove = (file: File) => {
    setFiles(prev => prev.filter(f => f !== file));
    setPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[file.name];
      return newPreviews;
    });
    if (onRemove) {
      onRemove(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      
      <div
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          disabled || uploading
            ? "border-border bg-background-tertiary cursor-not-allowed opacity-50"
            : "border-border bg-background-secondary hover:border-accent"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptType}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm text-foreground-muted">Uploading...</p>
          </div>
        ) : (
          <>
            <Icon className="w-8 h-8 mx-auto mb-2 text-foreground-muted" />
            <p className="text-sm text-foreground-secondary mb-1">
              Click to upload {fileType === 'any' ? 'files' : fileType + 's'}
            </p>
            <p className="text-xs text-foreground-muted">
              {acceptType !== '*/*' && `Accepts: ${acceptType.replace(/\*/g, '')}`}
              {maxSize && ` • Max ${maxSize}MB per file`}
            </p>
          </>
        )}
      </div>

      {hint && (
        <p className="mt-1.5 text-xs text-foreground-muted">{hint}</p>
      )}

      {/* File List */}
      {(files.length > 0 || existingFiles.length > 0) && (
        <div className="mt-4 space-y-2">
          {existingFiles.map((file, index) => (
            <div
              key={`existing-${index}`}
              className="flex items-center justify-between p-2 rounded-md bg-background-tertiary"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-foreground-muted" />
                <span className="text-sm text-foreground">{file.name}</span>
                {file.size && (
                  <span className="text-xs text-foreground-muted">({file.size})</span>
                )}
              </div>
              {file.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  View
                </a>
              )}
            </div>
          ))}
          
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 rounded-md bg-background-tertiary"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {previews[file.name] ? (
                  <img
                    src={previews[file.name]}
                    alt={file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <File className="h-4 w-4 text-foreground-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-foreground-muted">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(file)}
                disabled={disabled}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
