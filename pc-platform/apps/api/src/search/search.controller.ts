import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { ApiResponse } from '../common/dto/response.dto';

import type { SearchQueryDto, SuggestQueryDto } from './dto/search.dto';
import type { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Search catalog products with multi-field matching, faceted aggregations, filters, sorting, and pagination',
  })
  @SwaggerResponse({ status: 200, description: 'Faceted search results with matching products' })
  async search(@Query() queryDto: SearchQueryDto) {
    const result = await this.searchService.search(queryDto);
    return ApiResponse.ok(result);
  }

  @Get('suggest')
  @Public()
  @ApiOperation({
    summary: 'Instant autocomplete & search suggestions for search inputs',
  })
  @SwaggerResponse({ status: 200, description: 'Array of search suggestions' })
  async suggest(@Query() suggestDto: SuggestQueryDto) {
    const suggestions = await this.searchService.suggest(suggestDto);
    return ApiResponse.ok(suggestions);
  }
}
