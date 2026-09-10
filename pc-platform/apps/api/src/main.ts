/**
 * NestJS API — Bootstrap Entry Point
 *
 * Configures:
 *  - Global ValidationPipe (class-validator, whitelist, transform)
 *  - Global AllExceptionsFilter (consistent error responses)
 *  - Global ResponseTransformInterceptor (wraps data in ApiResponse<T>)
 *  - Global LoggingInterceptor (structured request logging)
 *  - Global JwtAuthGuard (JWT required on all routes unless @Public())
 *  - Helmet (security headers)
 *  - CORS (configured origins from env)
 *  - Cookie parser (for refresh token httpOnly cookie)
 *  - API versioning via URL prefix /api/v1
 *  - Swagger UI at /api/v1/docs
 */

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpCacheInterceptor } from './common/interceptors/http-cache.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ── Static Asset Serving (Object Storage Local Provider) ──────
  const uploadsDir = path.isAbsolute(process.env['LOCAL_STORAGE_DIR'] || 'uploads')
    ? (process.env['LOCAL_STORAGE_DIR'] || 'uploads')
    : path.resolve(process.cwd(), process.env['LOCAL_STORAGE_DIR'] || 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // ── Security Headers ──────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: process.env['NODE_ENV'] === 'production',
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────
  const corsOrigins = (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Cookie Parser (refresh token) ─────────────────────────────
  app.use(cookieParser());

  // ── Global API Prefix ─────────────────────────────────────────
  const apiPrefix = process.env['API_PREFIX'] ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', 'health/db', 'health/(.*)'], // Allow /health and /health/db without prefix for load balancers
  });

  // ── Global Validation Pipe ────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,               // Strip unknown properties
      forbidNonWhitelisted: true,    // Reject requests with unknown properties
      transform: true,               // Auto-cast query params (string → number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Exception Filter ───────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Global Interceptors ───────────────────────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
    new HttpCacheInterceptor(),
  );

  // ── Global JWT Guard (all routes protected unless @Public()) ──
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ── Swagger / OpenAPI ─────────────────────────────────────────
  if (process.env['NODE_ENV'] !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PC Platform API')
      .setDescription(
        'REST API for the custom PC builder + e-commerce platform.\n\n' +
        'All endpoints require JWT Bearer authentication unless marked **🔓 Public**.\n\n' +
        'Base URL: `/api/v1`',
      )
      .setVersion('2.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addTag('auth', 'Authentication & authorization')
      .addTag('users', 'User profiles and addresses')
      .addTag('products', 'Product catalog')
      .addTag('categories', 'Product categories')
      .addTag('brands', 'Hardware brands')
      .addTag('inventory', 'Stock management')
      .addTag('prices', 'Pricing management')
      .addTag('builds', 'Custom PC builds')
      .addTag('cart', 'Shopping cart')
      .addTag('orders', 'Order management')
      .addTag('reviews', 'Product reviews')
      .addTag('wishlist', 'Wishlists')
      .addTag('roles', 'RBAC roles & permissions')
      .addTag('admin', 'Admin panel')
      .addTag('health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // ── Start Server ──────────────────────────────────────────────
  const port = Number(process.env['API_PORT'] ?? 4000);
  await app.listen(port);

  logger.log(`🚀 API running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`📖 Swagger:  http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🏥 Health:   http://localhost:${port}/${apiPrefix}/health`);
}

void bootstrap();
