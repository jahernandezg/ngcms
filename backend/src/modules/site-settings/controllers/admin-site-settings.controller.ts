import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from '../site-settings.service';
import { JwtAuthGuard } from '../../admin/guards/jwt-auth.guard';
import { RolesGuard } from '../../admin/guards/roles.guard';
import { Roles } from '../../admin/decorators/roles.decorator';

@Controller('admin/site-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSiteSettingsController {
  constructor(private settings: SiteSettingsService) {}
  @Get() get() { return this.settings.get(); }
  @Put() update(@Body() body: { siteName?: string; tagline?: string; defaultMetaDesc?: string; logoUrl?: string; faviconUrl?: string }) { return this.settings.update(body); }
}
