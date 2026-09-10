import { BadRequestException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import type { StorageProvider } from './interfaces/storage-provider.interface';
import { STORAGE_PROVIDER_TOKEN } from './interfaces/storage-provider.interface';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockProvider: jest.Mocked<StorageProvider>;

  beforeEach(async () => {
    mockProvider = {
      name: 'mock',
      upload: jest.fn().mockImplementation(async (file, key, options) => ({
        storageKey: key,
        url: `https://storage.mock.com/${key}`,
        sizeBytes: file.length,
        mimeType: options?.contentType || 'image/jpeg',
      })),
      download: jest.fn().mockResolvedValue({
        data: Buffer.from('mock-data'),
      }),
      delete: jest.fn().mockResolvedValue(true),
      getPublicUrl: jest.fn().mockImplementation((key) => `https://storage.mock.com/${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: STORAGE_PROVIDER_TOKEN,
          useValue: mockProvider,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined with active provider name', () => {
    expect(service).toBeDefined();
    expect(service.activeProviderName).toBe('mock');
  });

  it('should upload product image with structured key', async () => {
    const file = Buffer.from('image-bytes');
    const result = await service.uploadProductImage(
      'prod-456',
      file,
      'rtx-4080.webp',
      'image/webp',
    );

    expect(result.storageKey).toMatch(/^products\/prod-456\/rtx-4080-\d+-[a-z0-9]+\.webp$/);
    expect(mockProvider.upload).toHaveBeenCalled();
  });

  it('should reject unsupported mime types', async () => {
    const file = Buffer.from('malicious-exe');
    await expect(
      service.uploadFile(file, 'malware.exe', 'temp', 'application/x-msdownload'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should delegate deleteFile and getPublicUrl', async () => {
    await service.deleteFile('some/key.png');
    expect(mockProvider.delete).toHaveBeenCalledWith('some/key.png');

    const url = service.getPublicUrl('some/key.png');
    expect(url).toBe('https://storage.mock.com/some/key.png');
  });
});
