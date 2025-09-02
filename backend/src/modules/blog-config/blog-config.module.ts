import { Module } from '@nestjs/common';
import { DatabaseModule } from '@cms-workspace/database';
import { BlogConfigService } from './blog-config.service';
import { PublicBlogConfigController } from './controllers/public-blog-config.controller';
import { AdminBlogConfigController } from './controllers/admin-blog-config.controller';

@Module({
  imports: [DatabaseModule],
  providers: [BlogConfigService],
  controllers: [PublicBlogConfigController, AdminBlogConfigController],
  exports: [BlogConfigService]
})
export class BlogConfigModule {}
