/**
 * ResponseTransformInterceptor — wraps every successful response in ApiResponse<T>.
 *
 * Before: controller returns { id: '...', name: 'AMD Ryzen 9' }
 * After:  { success: true, data: { id: '...', name: 'AMD Ryzen 9' }, timestamp: '...' }
 *
 * Note: PaginatedResponse already wraps itself — this interceptor detects
 * and passes it through unchanged.
 */

import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor} from '@nestjs/common';
import {
  Injectable
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponse, PaginatedResponse } from '../dto/response.dto';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | PaginatedResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | PaginatedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Already wrapped (e.g. paginated) — pass through
        if (data instanceof ApiResponse || data instanceof PaginatedResponse) {
          return data;
        }
        // Wrap single responses
        return ApiResponse.ok(data);
      }),
    );
  }
}
