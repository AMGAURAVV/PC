/**
 * AllExceptionsFilter — Global exception handler.
 *
 * Maps ALL exception types to a consistent JSON error envelope:
 * {
 *   "success": false,
 *   "statusCode": 422,
 *   "message": "Validation failed",
 *   "errors": { "email": ["must be a valid email"] },
 *   "timestamp": "2026-09-08T12:00:00.000Z",
 *   "path": "/api/v1/auth/register"
 * }
 *
 * Handles:
 *   - HttpException (NestJS built-in)
 *   - ValidationError (class-validator)
 *   - Prisma client errors (P2002 unique violations, P2025 not-found, etc.)
 *   - Unknown errors (500 fallback)
 */

import type {
  ArgumentsHost,
  ExceptionFilter} from '@nestjs/common';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@pc-platform/database';
import type { Request, Response } from 'express';

import type { ErrorResponse } from '../dto/response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, errors } = this.resolveError(exception);

    // Log server errors (5xx) with stack traces
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${statusCode}: ${message}`);
    }

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: string[] | Record<string, string[]>;
  } {
    // ── NestJS HttpException ─────────────────────────────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        // class-validator ValidationPipe produces { message: string[], error: string }
        if (Array.isArray(r['message'])) {
          return {
            statusCode: status,
            message: 'Validation failed',
            errors: r['message'] as string[],
          };
        }
        return {
          statusCode: status,
          message: typeof r['message'] === 'string' ? r['message'] : exception.message,
        };
      }

      return { statusCode: status, message: exception.message };
    }

    // ── Prisma errors ────────────────────────────────────────────
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Database validation error' };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return { statusCode: HttpStatus.SERVICE_UNAVAILABLE, message: 'Database unavailable' };
    }

    // ── Unknown ──────────────────────────────────────────────────
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private resolvePrismaError(
    e: Prisma.PrismaClientKnownRequestError,
  ): { statusCode: number; message: string; errors?: string[] } {
    switch (e.code) {
      case 'P2002': {
        // Unique constraint violation
        const fields = Array.isArray(e.meta?.['target']) ? (e.meta['target'] as string[]) : [];
        const fieldStr = fields.join(', ');
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${fieldStr || 'value'} already exists`,
        };
      }
      case 'P2025':
        // Record not found
        return { statusCode: HttpStatus.NOT_FOUND, message: 'Record not found' };
      case 'P2003':
        // Foreign key constraint
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Related record does not exist' };
      case 'P2014':
        // Required relation violation
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Invalid relation' };
      default:
        this.logger.error(`Unhandled Prisma error code: ${e.code}`, e.message);
        return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error' };
    }
  }
}
