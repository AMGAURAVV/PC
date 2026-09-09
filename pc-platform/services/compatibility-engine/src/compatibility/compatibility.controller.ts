import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CompatibilityService } from './compatibility.service';
import type { BuildComponents, CompatibilityResult } from '@pc-platform/types';

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
