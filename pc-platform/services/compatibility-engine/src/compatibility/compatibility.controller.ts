import { Controller, Post, Body } from '@nestjs/common';
import type { BuildComponents, CompatibilityResult } from '@pc-platform/types';

import { CompatibilityService } from './compatibility.service';

/**
 * CompatibilityController
 *
 * Exposes a single endpoint: POST /check
 * Protected by internal API key (ApiKeyGuard).
 *
 * Only apps/api should call this endpoint.
 * Never exposed via Nginx to public internet.
 */
@Controller()
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Post('check')
  check(@Body() components: BuildComponents): CompatibilityResult {
    return this.compatibilityService.check(components);
  }
}
