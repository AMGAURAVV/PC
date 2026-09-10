import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type {
  StorageProvider,
  UploadOptions,
  UploadResult,
  DownloadResult,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    const rawDir = this.config.get<string>('LOCAL_STORAGE_DIR') || 'uploads';
    this.uploadDir = path.isAbsolute(rawDir)
      ? rawDir
      : path.resolve(process.cwd(), rawDir);

    const apiPort = Number(this.config.get<string>('API_PORT') || 4000);
    const configuredBase = this.config.get<string>('LOCAL_STORAGE_BASE_URL');

    this.baseUrl = configuredBase
      ? configuredBase.replace(/\/$/, '')
      : `http://localhost:${apiPort}/uploads`;

    this.ensureDirectory(this.uploadDir);
    this.logger.log(`LocalStorageProvider initialized. Storing at: ${this.uploadDir}`);
  }

  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private resolveFilePath(key: string): string {
    // Canonical directory traversal check
    const safeKey = key.replace(/^\/+/, '');
    const resolvedPath = path.resolve(this.uploadDir, safeKey);
    const normalizedUploadDir = path.resolve(this.uploadDir);

    if (!resolvedPath.startsWith(normalizedUploadDir)) {
      throw new Error(`Path traversal attempt detected with storage key: "${key}"`);
    }
    return resolvedPath;
  }

  async upload(
    file: Buffer | Uint8Array,
    key: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const filePath = this.resolveFilePath(key);
    const parentDir = path.dirname(filePath);
    this.ensureDirectory(parentDir);

    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    await fs.promises.writeFile(filePath, buffer);

    const mimeType = options?.contentType || 'application/octet-stream';
    const publicUrl = this.getPublicUrl(key);

    this.logger.debug(`File written to local disk: ${filePath} (${buffer.length} bytes)`);

    return {
      storageKey: key,
      url: publicUrl,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const filePath = this.resolveFilePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at storage key: "${key}"`);
    }

    const data = await fs.promises.readFile(filePath);
    return {
      data,
      contentLength: data.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.resolveFilePath(key);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      await fs.promises.unlink(filePath);
      this.logger.debug(`File deleted: ${filePath}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Failed to delete file at ${filePath}: ${err.message}`);
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '').split('\\').join('/');
    return `${this.baseUrl}/${cleanKey}`;
  }
}
