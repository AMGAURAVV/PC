/**
 * Response DTOs — consistent API response envelope.
 *
 * Every endpoint returns one of:
 *   ApiResponse<T>          → single resource
 *   PaginatedResponse<T>    → list with pagination metadata
 *
 * These types are applied by ResponseTransformInterceptor automatically.
 * Controllers never construct these manually.
 */

import { ApiProperty } from '@nestjs/swagger';

// ── Pagination metadata ────────────────────────────────────────────────────
export class PaginationMeta {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPrevPage!: boolean;

  static create(page: number, limit: number, total: number): PaginationMeta {
    const meta = new PaginationMeta();
    meta.page = page;
    meta.limit = limit;
    meta.total = total;
    meta.totalPages = Math.ceil(total / limit);
    meta.hasNextPage = page < meta.totalPages;
    meta.hasPrevPage = page > 1;
    return meta;
  }
}

// ── Single-resource response ───────────────────────────────────────────────
export class ApiResponse<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  data!: T;

  @ApiProperty({ example: '2026-09-08T12:00:00.000Z' })
  timestamp!: string;

  static ok<T>(data: T): ApiResponse<T> {
    const r = new ApiResponse<T>();
    r.success = true;
    r.data = data;
    r.timestamp = new Date().toISOString();
    return r;
  }
}

// ── Paginated list response ────────────────────────────────────────────────
export class PaginatedResponse<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  data!: T[];

  @ApiProperty({ type: () => PaginationMeta })
  meta!: PaginationMeta;

  @ApiProperty()
  timestamp!: string;

  static ok<T>(data: T[], page: number, limit: number, total: number): PaginatedResponse<T> {
    const r = new PaginatedResponse<T>();
    r.success = true;
    r.data = data;
    r.meta = PaginationMeta.create(page, limit, total);
    r.timestamp = new Date().toISOString();
    return r;
  }
}

// ── Error response (used in exception filter) ──────────────────────────────
export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;
  path: string;
}
