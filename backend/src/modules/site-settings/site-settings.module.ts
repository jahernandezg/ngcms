import { Module } from '@nestjs/common';
import { DatabaseModule } from '@cms-workspace/database';
import { SiteSettingsService } from './site-settings.service';
import { AdminSiteSettingsController } from './controllers/admin-site-settings.controller';
import { PublicSiteSettingsController } from './controllers/public-site-settings.controller';

@Module({
  imports: [DatabaseModule],
  providers: [SiteSettingsService],
  controllers: [AdminSiteSettingsController, PublicSiteSettingsController],
  exports: [SiteSettingsService]
})
export class SiteSettingsModule {}
