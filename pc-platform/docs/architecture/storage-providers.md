# Object-Storage Abstraction & Multi-Provider Architecture

> Covers `apps/api/src/storage` and related product media management workflows  
> Status: Active | Version: 2.0.0

---

## 1. Guiding Principle

**The application must NEVER assume images are stored on the local filesystem in production.**

All product photography, marketing banners, and media assets are abstracted behind a unified interface: [`StorageProvider`](file:///d:/project/pc-platform/apps/api/src/storage/interfaces/storage-provider.interface.ts). 

Neither controllers, domain services, nor database entities deal with raw file system writes in production. In development, a local provider simulates object storage; in staging and production, cloud object storage providers (e.g., Google Cloud Storage or S3-compatible endpoints) fulfill requests identically.

---

## 2. Core Abstraction (`StorageProvider`)

Located in [`apps/api/src/storage/interfaces/storage-provider.interface.ts`](file:///d:/project/pc-platform/apps/api/src/storage/interfaces/storage-provider.interface.ts):

```typescript
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
  readonly name: string;
  upload(file: Buffer | Uint8Array, key: string, options?: UploadOptions): Promise<UploadResult>;
  download(key: string): Promise<DownloadResult>;
  delete(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}

export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER_TOKEN';
```

---

## 3. Supported Providers

### A. `LocalStorageProvider` (`name: 'local'`)
- **Use Case**: Local development and automated testing environments.
- **Behavior**: Writes files directly to a designated local directory (`LOCAL_STORAGE_DIR`, default `./uploads`), and serves them statically via NestJS express middleware mounted at `/uploads/*`.
- **Directory Traversal Protection**: Sanitizes keys to ensure files stay strictly within the configured root directory.

### B. `GoogleCloudStorageProvider` (`name: 'gcs'`)
- **Use Case**: Production & staging cloud environments on Google Cloud Platform.
- **Behavior**: Future-compatible cloud provider interfacing with Google Cloud Storage (`gs://<bucket>/<key>`). Generates public CDN / GCS URLs (`https://storage.googleapis.com/<bucket>/<key>` or custom CDN prefix `GCS_PUBLIC_URL_PREFIX`).
- **Activation Status**: Ready for activation. Not enabled by default until configured via environment variables.

---

## 4. Switching Providers via Environment Variables

Storage provider selection is completely dynamic and declared at process startup. Switching between Local Disk and Google Cloud Storage requires **zero code changes**:

### Option 1: Local Filesystem Storage (Default / Development)
In `.env` or `.env.local`:
```bash
# Set provider to local
STORAGE_PROVIDER=local

# Local directory where files will be stored (relative or absolute)
LOCAL_STORAGE_DIR=uploads

# Base public URL where static files are served
LOCAL_STORAGE_BASE_URL=http://localhost:4000/uploads
```

### Option 2: Google Cloud Storage (Production)
In `.env` or Cloud Run / Kubernetes environment variables:
```bash
# Switch to GCS provider
STORAGE_PROVIDER=gcs

# GCP Storage Bucket Name
GCS_BUCKET_NAME=pc-platform-production-assets

# GCP Project ID
GCS_PROJECT_ID=pc-platform-prod

# Optional: Custom Cloud CDN or custom domain URL prefix
GCS_PUBLIC_URL_PREFIX=https://cdn.pcplatform.in

# Path to Google Cloud Service Account JSON Key (or use GCP Workload Identity / ADC)
GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcp-sa-key.json
```

---

## 5. Product Image Metadata Model

Product images in the database (`ProductImage` entity) store rich object-storage references:

| Field | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Primary image identifier |
| `productId` | `String` | Foreign key referencing `Product` |
| `storageKey` | `String?` | Object storage path / bucket key (e.g. `products/<id>/box-1725890-a8f9.webp`) |
| `url` | `String` | Public URL or CDN reference |
| `altText` | `String?` | Accessibility description |
| `width` | `Int?` | Natural image width in pixels |
| `height` | `Int?` | Natural image height in pixels |
| `sortOrder` | `Int` | Display position in galleries (0 = first) |
| `isPrimary` | `Boolean` | Flag indicating storefront thumbnail |
| `sizeBytes` | `Int?` | File size |
| `mimeType` | `String?` | Media type (e.g., `image/webp`, `image/png`) |

---

## 6. Image Lifecycle & Automatic Storage Cleanup

1. **Upload**:
   - Files are uploaded via `POST /api/v1/storage/upload?folder=products/<productId>`.
   - The active `StorageProvider` saves the file and returns `{ storageKey, url, sizeBytes, mimeType }`.
2. **Associating with Product**:
   - `POST /api/v1/products/:id/images` stores the image metadata with its `storageKey`.
3. **Automatic Deletion**:
   - When an image is deleted via `DELETE /api/v1/products/:id/images/:imageId`, `ProductsService` / `AdminProductsService` automatically queries the stored `storageKey` and calls `StorageService.deleteFile(storageKey)`, guaranteeing no orphaned binary files remain in storage.

---

## 7. Admin UI Product Editor Integration

The Admin Backoffice deep product editor ([`apps/admin/src/app/products/[id]/page.tsx`](file:///d:/project/pc-platform/apps/admin/src/app/products/%5Bid%5D/page.tsx)) includes:
- **Direct File Upload Zone**: Lets administrators upload image files (`.png`, `.jpg`, `.webp`) directly to the backend storage endpoint.
- **Auto Dimension Detection**: Detects natural image dimensions (`naturalWidth` × `naturalHeight`).
- **Metadata Editing**: Full support for editing `altText`, `sortOrder`, `width`, and `height`.
- **Storage Key Badge**: Displays the active object storage key for every asset in the gallery.
