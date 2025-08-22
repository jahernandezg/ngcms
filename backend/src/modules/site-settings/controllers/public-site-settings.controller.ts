import { Controller, Get } from '@nestjs/common';
import { SiteSettingsService } from '../site-settings.service';

@Controller('site-settings')
export class PublicSiteSettingsController {
  constructor(private svc: SiteSettingsService) {}
  @Get('public')
  getPublic() { return this.svc.get(); }
}
