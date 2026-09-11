import * as path from 'path';

import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';

import {
  StorageProvider,
  UploadResult,
  STORAGE_PROVIDER_TOKEN
} from './interfaces/storage-provider.interface';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
]);

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly provider: StorageProvider,
  ) {
    this.logger.log(`StorageService initialized with provider: "${this.provider.name}"`);
  }

  get activeProviderName(): string {
    return this.provider.name;
  }

  /**
   * Upload an arbitrary file to the active storage provider
   */
  async uploadFile(
    fileBuffer: Buffer | Uint8Array,
    filename: string,
    folder: string = 'general',
    contentType?: string,
  ): Promise<UploadResult> {
    if (contentType && !ALLOWED_MIME_TYPES.has(contentType.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported media type "${contentType}". Allowed types: JPEG, PNG, WEBP, AVIF, SVG`,
      );
    }

    const ext = path.extname(filename) || '.jpg';
    const base = path.basename(filename, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storageKey = `${folder}/${base}-${timestamp}-${randomSuffix}${ext}`;

    return this.provider.upload(fileBuffer, storageKey, {
      contentType,
      isPublic: true,
    });
  }

  /**
   * Upload a product image specifically
   */
  async uploadProductImage(
    productId: string,
    fileBuffer: Buffer | Uint8Array,
    filename: string,
    contentType?: string,
  ): Promise<UploadResult> {
    return this.uploadFile(fileBuffer, filename, `products/${productId}`, contentType);
  }

  /**
   * Delete an object from storage
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!key) return false;
    return this.provider.delete(key);
  }

  /**
   * Retrieve the public URL for an object
   */
  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }
}
