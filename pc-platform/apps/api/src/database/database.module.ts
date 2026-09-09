/**
 * DatabaseModule — wraps DatabaseService from packages/database
 * and makes it available to all feature modules.
 */
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

@Global() // Makes DatabaseService available everywhere without re-importing
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
