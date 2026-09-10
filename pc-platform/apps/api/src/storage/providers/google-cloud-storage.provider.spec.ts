import { ConfigService } from '@nestjs/config';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { GoogleCloudStorageProvider } from './google-cloud-storage.provider';

describe('GoogleCloudStorageProvider', () => {
  let provider: GoogleCloudStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCloudStorageProvider,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'GCS_BUCKET_NAME') return 'test-hardware-bucket';
              if (key === 'GCS_PROJECT_ID') return 'gcp-hardware-project';
              if (key === 'GCS_PUBLIC_URL_PREFIX') return 'https://cdn.pcplatform.in';
              return null;
            },
          },
        },
      ],
    }).compile();

    provider = module.get<GoogleCloudStorageProvider>(GoogleCloudStorageProvider);
  });

  it('should be defined and named "gcs"', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('gcs');
  });

  it('should return public URL formatted with custom cdn prefix', () => {
    const url = provider.getPublicUrl('products/ryzen-7/photo.jpg');
    expect(url).toBe('https://cdn.pcplatform.in/products/ryzen-7/photo.jpg');
  });

  it('should upload mock object and return gcs metadata and public url', async () => {
    const buffer = Buffer.from('gcs-image-content');
    const result = await provider.upload(buffer, 'cases/nzxt-h9/front.png', {
      contentType: 'image/png',
    });

    expect(result.storageKey).toBe('cases/nzxt-h9/front.png');
    expect(result.url).toBe('https://cdn.pcplatform.in/cases/nzxt-h9/front.png');
    expect(result.sizeBytes).toBe(buffer.length);
    expect(result.mimeType).toBe('image/png');
  });

  it('should handle delete gracefully', async () => {
    const deleted = await provider.delete('cases/nzxt-h9/front.png');
    expect(deleted).toBe(true);
  });
});
