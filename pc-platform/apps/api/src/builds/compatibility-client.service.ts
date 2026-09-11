import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompatibilityService as InProcessCompatibilityService } from '@pc-platform/compatibility-engine';
import type { BuildComponents, CompatibilityResult } from '@pc-platform/types';
import { firstValueFrom } from 'rxjs';

/**
 * CompatibilityClientService
 *
 * Calls the logically independent compatibility-engine microservice via HTTP POST /check.
 * If the microservice is temporarily unavailable (e.g. during local developer test suites),
 * falls back to the in-process CompatibilityService so the API never fails.
 *
 * Source of truth: backend compatibility engine.
 */
@Injectable()
export class CompatibilityClientService {
  private readonly logger = new Logger(CompatibilityClientService.name);
  private readonly serviceUrl: string;
  private readonly inProcessFallback: InProcessCompatibilityService;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const defaultUrl = 'http://localhost:4001';
    this.serviceUrl =
      this.configService.get<string>('COMPATIBILITY_ENGINE_URL') ||
      this.configService.get<string>('COMPATIBILITY_SERVICE_URL') ||
      defaultUrl;
    this.inProcessFallback = new InProcessCompatibilityService();
  }

  async check(components: BuildComponents): Promise<CompatibilityResult> {
    try {
      const endpoint = `${this.serviceUrl.replace(/\/$/, '')}/check`;
      const response = await firstValueFrom(
        this.httpService.post<CompatibilityResult>(endpoint, components, {
          timeout: 4000,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response && response.data && response.data.status) {
        return response.data;
      }
      throw new Error('Invalid response structure from compatibility engine');
    } catch (err: any) {
      this.logger.warn(
        `Compatibility engine HTTP service unreachable at ${this.serviceUrl} (${err?.message || err}). Falling back to in-process rule engine.`,
      );
      // Fallback evaluates the exact same 22 rules deterministically
      return this.inProcessFallback.check(components);
    }
  }
}
