import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { STORAGE_PROVIDER_TOKEN } from './interfaces/storage-provider.interface';
import { GoogleCloudStorageProvider } from './providers/google-cloud-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    LocalStorageProvider,
    GoogleCloudStorageProvider,
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: (
        config: ConfigService,
        local: LocalStorageProvider,
        gcs: GoogleCloudStorageProvider,
      ) => {
        const providerName = (
          config.get<string>('STORAGE_PROVIDER') || 'local'
        ).toLowerCase();

        if (providerName === 'gcs') {
          return gcs;
        }

        return local;
      },
      inject: [ConfigService, LocalStorageProvider, GoogleCloudStorageProvider],
    },
  ],
  exports: [StorageService, STORAGE_PROVIDER_TOKEN],
})
export class StorageModule {}
