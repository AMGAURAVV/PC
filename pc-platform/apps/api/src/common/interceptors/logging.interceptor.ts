/**
 * LoggingInterceptor — structured request/response logging.
 *
 * Logs: method, URL, status code, duration (ms) for every request.
 *
 * Output format:
 *   → GET /api/v1/products
 *   ← GET /api/v1/products 200 [42ms]
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url } = req;
    const startTime = Date.now();

    this.logger.log(`→ ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startTime;
          this.logger.log(`← ${method} ${url} ${res.statusCode} [${ms}ms]`);
        },
        error: () => {
          const ms = Date.now() - startTime;
          this.logger.warn(`← ${method} ${url} ERR [${ms}ms]`);
        },
      }),
    );
  }
}
