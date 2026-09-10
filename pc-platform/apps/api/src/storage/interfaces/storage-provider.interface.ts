/**
 * StorageProvider Interface & Core Types
 *
 * Provider-agnostic object-storage abstraction.
 * Ensures the application never assumes images are stored on the local filesystem in production.
 */

export interface UploadOptions {
  contentType?: string | undefined;
  metadata?: Record<string, string> | undefined;
  isPublic?: boolean | undefined;
}

export interface UploadResult {
  storageKey: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
  etag?: string | undefined;
}

export interface DownloadResult {
  data: Buffer;
  contentType?: string | undefined;
  metadata?: Record<string, string> | undefined;
  contentLength?: number | undefined;
}

export interface StorageProvider {
  /**
   * Name of the active storage provider (e.g., 'local', 'gcs')
   */
  readonly name: string;

  /**
   * Upload an object into the storage provider
   */
  upload(
    file: Buffer | Uint8Array,
    key: string,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  /**
   * Download an object from the storage provider
   */
  download(key: string): Promise<DownloadResult>;

  /**
   * Delete an object from the storage provider
   */
  delete(key: string): Promise<boolean>;

  /**
   * Get the publicly accessible URL for a given storage key
   */
  getPublicUrl(key: string): string;
}

export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER_TOKEN';
