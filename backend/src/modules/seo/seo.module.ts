import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { DatabaseModule } from '@cms-workspace/database';

@Module({
  imports: [DatabaseModule],
  controllers: [SeoController],
})
export class SeoModule {}
