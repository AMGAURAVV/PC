import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor} from '@nestjs/common';
import {
  Injectable
} from '@nestjs/common';
import type { Response, Request } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        // Only set caching headers on successful GET responses
        if (req.method !== 'GET' || res.statusCode >= 400) {
          return;
        }

        const url = req.originalUrl || req.url || '';

        // Private / authenticated endpoints must not be cached publicly
        if (
          url.includes('/auth') ||
          url.includes('/cart') ||
          url.includes('/checkout') ||
          url.includes('/orders') ||
          url.includes('/users') ||
          url.includes('/wishlist') ||
          url.includes('/admin')
        ) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          return;
        }

        // Static reference catalogs (categories, brands) — highly cacheable (5 min browser, 1 hour CDN)
        if (url.includes('/categories') || url.includes('/brands')) {
          res.setHeader(
            'Cache-Control',
            'public, max-age=300, s-maxage=3600, stale-while-revalidate=7200',
          );
          return;
        }

        // Public catalog products, searches, and community builds (1 min browser, 5 min CDN)
        if (
          url.includes('/products') ||
          url.includes('/community') ||
          url.includes('/search')
        ) {
          res.setHeader(
            'Cache-Control',
            'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          );
          return;
        }
      }),
    );
  }
}
