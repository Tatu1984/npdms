// File upload utility for MinIO/S3 compatible storage

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface UploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadCategory = 'photos' | 'documents' | 'audio' | 'video' | 'evidence';

/**
 * Get a presigned URL for direct upload to MinIO
 */
export async function getPresignedUploadUrl(
  filename: string,
  category: UploadCategory,
  contentType: string
): Promise<{ uploadUrl: string; objectKey: string } | null> {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/v1/upload/presigned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename,
        category,
        contentType,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get presigned URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    return null;
  }
}

/**
 * Upload a file directly to MinIO using presigned URL
 */
export async function uploadToMinIO(
  file: File,
  category: UploadCategory,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
  try {
    // First, get a presigned URL
    const presignedData = await getPresignedUploadUrl(
      file.name,
      category,
      file.type
    );

    if (!presignedData) {
      return { success: false, error: 'Failed to get upload URL' };
    }

    // Upload directly to MinIO using presigned URL
    const response = await new Promise<UploadResponse>((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            url: `${API_BASE_URL}/api/v1/files/${presignedData.objectKey}`,
            key: presignedData.objectKey,
          });
        } else {
          resolve({ success: false, error: 'Upload failed' });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: 'Network error during upload' });
      });

      xhr.open('PUT', presignedData.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    return response;
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload failed' };
  }
}

/**
 * Upload a file via the API server (multipart form)
 * Use this if presigned URLs are not available
 */
export async function uploadViaAPI(
  file: File,
  category: UploadCategory,
  entityType?: string,
  entityId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> {
  try {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);

    const response = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        resolve(new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
        }));
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/v1/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.message || 'Upload failed' };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
      key: data.key,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload failed' };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  category: UploadCategory,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadViaAPI(
      files[i],
      category,
      undefined,
      undefined,
      (progress) => onProgress?.(i, progress)
    );
    results.push(result);
  }

  return results;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 50, allowedTypes } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      if (type.includes('*')) {
        const prefix = type.split('/')[0];
        return file.type.startsWith(prefix);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get allowed file types for each category
 */
export function getAllowedTypes(category: UploadCategory): string[] {
  switch (category) {
    case 'photos':
      return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    case 'documents':
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ];
    case 'audio':
      return ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    case 'video':
      return ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    case 'evidence':
      return []; // Allow all types for evidence
    default:
      return [];
  }
}

/**
 * Get maximum file size for each category (in MB)
 */
export function getMaxFileSize(category: UploadCategory): number {
  switch (category) {
    case 'photos':
      return 10;
    case 'documents':
      return 25;
    case 'audio':
      return 100;
    case 'video':
      return 500;
    case 'evidence':
      return 1000;
    default:
      return 50;
  }
}
