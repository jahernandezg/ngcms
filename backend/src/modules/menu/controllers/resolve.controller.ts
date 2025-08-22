import { Controller, Get, Query } from '@nestjs/common';
import { MenuService } from '../menu.service';

@Controller('resolve')
export class ResolveController {
  constructor(private menu: MenuService) {}

  @Get()
  async resolve(@Query('path') path = '') {
    const result = await this.menu.resolvePath(path || '');
    return { success: true, data: result };
  }
}
