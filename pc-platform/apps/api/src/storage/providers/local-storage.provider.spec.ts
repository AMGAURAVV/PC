import * as fs from 'fs';
import * as path from 'path';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';

import { LocalStorageProvider } from './local-storage.provider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  const testDir = path.resolve(__dirname, '../../../../test-uploads');

  beforeAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageProvider,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'LOCAL_STORAGE_DIR') return testDir;
              if (key === 'LOCAL_STORAGE_BASE_URL') return 'http://localhost:4000/uploads';
              if (key === 'API_PORT') return '4000';
              return null;
            },
          },
        },
      ],
    }).compile();

    provider = module.get<LocalStorageProvider>(LocalStorageProvider);
  });

  it('should be defined and named "local"', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('local');
  });

  it('should upload a buffer and return storageKey and public url', async () => {
    const fileBuffer = Buffer.from('fake-image-bytes');
    const key = 'products/prod-1/box.png';

    const result = await provider.upload(fileBuffer, key, {
      contentType: 'image/png',
    });

    expect(result.storageKey).toBe(key);
    expect(result.url).toBe('http://localhost:4000/uploads/products/prod-1/box.png');
    expect(result.sizeBytes).toBe(fileBuffer.length);
    expect(result.mimeType).toBe('image/png');

    const expectedDiskPath = path.join(testDir, 'products', 'prod-1', 'box.png');
    expect(fs.existsSync(expectedDiskPath)).toBe(true);
  });

  it('should download uploaded file', async () => {
    const fileBuffer = Buffer.from('hello-world');
    const key = 'test/file.txt';

    await provider.upload(fileBuffer, key);
    const download = await provider.download(key);

    expect(download.data.toString()).toBe('hello-world');
    expect(download.contentLength).toBe(fileBuffer.length);
  });

  it('should delete uploaded file', async () => {
    const fileBuffer = Buffer.from('to-delete');
    const key = 'test/delete.png';

    await provider.upload(fileBuffer, key);
    const deleted = await provider.delete(key);
    expect(deleted).toBe(true);

    const deletedAgain = await provider.delete(key);
    expect(deletedAgain).toBe(false);
  });

  it('should format public URL properly', () => {
    const url = provider.getPublicUrl('components/gpu/rtx4090.webp');
    expect(url).toBe('http://localhost:4000/uploads/components/gpu/rtx4090.webp');
  });

  it('should reject path traversal attempts with dangerous keys', async () => {
    const fileBuffer = Buffer.from('exploit');
    const maliciousKey = '../../etc/passwd';

    await expect(provider.upload(fileBuffer, maliciousKey)).rejects.toThrow(
      'Path traversal attempt detected',
    );
  });
});
