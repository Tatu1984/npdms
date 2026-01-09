import { useState, useCallback } from 'react';
import {
  uploadViaAPI,
  uploadToMinIO,
  uploadMultipleFiles,
  validateFile,
  getAllowedTypes,
  getMaxFileSize,
  UploadCategory,
  UploadResponse,
  UploadProgress,
} from '@/lib/upload';

export interface UseFileUploadOptions {
  category: UploadCategory;
  entityType?: string;
  entityId?: string;
  usePresigned?: boolean; // Use presigned URLs for direct upload to MinIO
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: string) => void;
}

export interface UploadedFile {
  name: string;
  url: string;
  key: string;
  size: number;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const {
    category,
    entityType,
    entityId,
    usePresigned = false,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const allowedTypes = getAllowedTypes(category);
  const maxSize = getMaxFileSize(category);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const validation = validateFile(file, {
          maxSizeMB: maxSize,
          allowedTypes: allowedTypes.length > 0 ? allowedTypes : undefined,
        });

        if (validation.valid) {
          valid.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      }

      return { valid, errors };
    },
    [allowedTypes, maxSize]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse> => {
      const handleProgress = (p: UploadProgress) => {
        setProgress(p);
        onProgress?.(p);
      };

      if (usePresigned) {
        return uploadToMinIO(file, category, handleProgress);
      }

      return uploadViaAPI(file, category, entityType, entityId, handleProgress);
    },
    [category, entityType, entityId, usePresigned, onProgress]
  );

  const upload = useCallback(
    async (files: File[]): Promise<UploadResponse[]> => {
      setUploading(true);
      setError(null);
      setProgress(null);

      const { valid, errors: validationErrors } = validateFiles(files);

      if (validationErrors.length > 0) {
        const errorMsg = validationErrors.join('\n');
        setError(errorMsg);
        onError?.(errorMsg);
        setUploading(false);
        return [];
      }

      const results: UploadResponse[] = [];

      try {
        for (let i = 0; i < valid.length; i++) {
          const file = valid[i];
          const result = await uploadFile(file);

          results.push(result);

          if (result.success && result.url && result.key) {
            const uploadedFile: UploadedFile = {
              name: file.name,
              url: result.url,
              key: result.key,
              size: file.size,
            };
            setUploadedFiles((prev) => [...prev, uploadedFile]);
            onSuccess?.(result);
          } else if (result.error) {
            setError(result.error);
            onError?.(result.error);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setUploading(false);
        setProgress(null);
      }

      return results;
    },
    [validateFiles, uploadFile, onSuccess, onError]
  );

  const removeFile = useCallback((key: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setError(null);
  }, []);

  return {
    upload,
    uploading,
    uploadedFiles,
    error,
    progress,
    removeFile,
    clearFiles,
    allowedTypes,
    maxSize,
  };
}

export default useFileUpload;
