import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('CompatibilityEngine');

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: false }); // Internal service — no browser CORS needed

  const port = Number(process.env['COMPATIBILITY_ENGINE_PORT'] ?? 4001);
  await app.listen(port);

  logger.log(`⚙️  Compatibility Engine running on http://localhost:${port}`);
  logger.log(`   POST /check — Validate component compatibility`);
}

void bootstrap();
