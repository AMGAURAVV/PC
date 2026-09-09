// ──────────────────────────────────────────────────────────────
// @pc-platform/database — Public Exports
//
// ONLY this package exports the Prisma client.
// apps/web and apps/admin must NEVER import from this package.
// ──────────────────────────────────────────────────────────────

// Re-export all Prisma types for use in backend services
export * from './generated';
export { Prisma } from './generated';

// DatabaseService is the NestJS-injectable abstraction
export { DatabaseService } from './database.service';
