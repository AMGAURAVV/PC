# How-To: Change or Add a Storage Provider

> **Target Audience:** DevOps, Backend & Infrastructure Engineers  
> **Estimated Time:** 15–20 minutes  
> **Files Involved:**  
> - `apps/api/src/storage/`  
> - `apps/api/src/storage/interfaces/storage-provider.interface.ts`  
> - `.env` or GitHub Environment Secrets

---

## 1. Overview & Architecture

Media assets (product photography, custom build snapshots, user avatars, invoice PDFs) are abstracted behind the `StorageProvider` interface.

The application never hardcodes local file paths. Changing storage providers (e.g. from Local Disk to Google Cloud Storage or AWS S3) is handled via environment variables or by creating a new provider implementing `StorageProvider`.

---

## 2. Switching Between Existing Providers

The platform supports `local`, `s3`, and `gcs` out of the box.

### Switch to Local Disk Storage (Default for Development)
In `.env`:
```bash
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
```

### Switch to Google Cloud Storage (Recommended for GCP)
In `.env.staging` / `.env.production`:
```bash
STORAGE_PROVIDER=gcs
GCS_BUCKET=pc-platform-prod-assets
GCS_PROJECT_ID=pc-platform-prod
GCS_PUBLIC_URL_PREFIX=https://storage.googleapis.com/pc-platform-prod-assets
```
Ensure the API container has the `roles/storage.objectAdmin` IAM permission.

### Switch to AWS S3 or S3-Compatible Cloudflare R2 / MinIO
In `.env`:
```bash
STORAGE_PROVIDER=s3
STORAGE_S3_BUCKET=pc-platform-assets
STORAGE_S3_REGION=ap-south-1
STORAGE_S3_ACCESS_KEY=YOUR_ACCESS_KEY
STORAGE_S3_SECRET_KEY=YOUR_SECRET_KEY
STORAGE_S3_ENDPOINT=https://s3.ap-south-1.amazonaws.com
CDN_BASE_URL=https://cdn.pcplatform.in
```

---

## 3. Implementing a New Storage Provider

To add support for a new provider (e.g., Azure Blob Storage):

### Step 1: Implement `StorageProvider`
Create `apps/api/src/storage/providers/azure-storage.provider.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import {
  StorageProvider,
  UploadOptions,
  UploadResult,
  DownloadResult,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class AzureBlobStorageProvider implements StorageProvider {
  readonly name = 'azure';
  private readonly logger = new Logger(AzureBlobStorageProvider.name);

  async upload(file: Buffer | Uint8Array, key: string, options?: UploadOptions): Promise<UploadResult> {
    // 1. Upload buffer to Azure Blob container
    // 2. Return standard UploadResult
    return {
      storageKey: key,
      url: this.getPublicUrl(key),
      sizeBytes: file.length,
      mimeType: options?.contentType || 'application/octet-stream',
    };
  }

  async download(key: string): Promise<DownloadResult> {
    // Download and return { data, contentType }
    throw new Error('Not implemented');
  }

  async delete(key: string): Promise<boolean> {
    // Delete blob and return boolean
    return true;
  }

  getPublicUrl(key: string): string {
    return `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_CONTAINER}/${key}`;
  }
}
```

### Step 2: Register in `StorageModule`
In `apps/api/src/storage/storage.module.ts`, add the provider to the factory instantiation based on `process.env.STORAGE_PROVIDER === 'azure'`.

---

## 4. Verification & Testing

Verify file upload by creating a product image via the admin API or test script:
```bash
curl -X POST http://localhost:4000/api/v1/admin/products/:id/images \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@test-image.webp"
```

Verify that the returned URL resolves and serves the uploaded image.
