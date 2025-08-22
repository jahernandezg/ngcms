import { Controller, Get } from '@nestjs/common';
import { ThemesService } from '../themes.service';

@Controller('theme')
export class PublicThemeController {
  constructor(private themes: ThemesService) {}
  @Get('active')
  getActive() { return this.themes.getActive(); }
}
