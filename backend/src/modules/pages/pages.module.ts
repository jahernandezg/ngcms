import { Module } from '@nestjs/common';
import { DatabaseModule } from '@cms-workspace/database';
import { PagesService } from './pages.service';
import { AdminPagesController } from './controllers/admin-pages.controller';
import { PublicPagesController } from './controllers/pages.controller';
import { SlugService } from '../shared/slug/slug.service';

@Module({
  imports: [DatabaseModule],
  providers: [PagesService, SlugService],
  controllers: [AdminPagesController, PublicPagesController],
  exports: [PagesService]
})
export class PagesModule {}
