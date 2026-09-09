import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompatibilityModule } from './compatibility/compatibility.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CompatibilityModule,
  ],
})
export class AppModule {}
