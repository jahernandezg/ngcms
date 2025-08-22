import { Module } from '@nestjs/common';
import { DatabaseModule } from '@cms-workspace/database';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  imports: [DatabaseModule],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [TagsService],
})
export class TagsModule {}
