import { Module } from '@nestjs/common';

import { SEARCH_PROVIDER_TOKEN } from './interfaces/search-provider.interface';
import { PostgresSearchProvider } from './providers/postgres-search.provider';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    PostgresSearchProvider,
    {
      provide: SEARCH_PROVIDER_TOKEN,
      useClass: PostgresSearchProvider,
    },
  ],
  exports: [SearchService, SEARCH_PROVIDER_TOKEN],
})
export class SearchModule {}
