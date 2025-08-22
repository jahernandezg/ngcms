import { Controller, Get } from '@nestjs/common';
import { MenuService } from '../menu.service';

@Controller('menu')
export class PublicMenuController {
  constructor(private menu: MenuService) {}
  @Get()
  list() { return this.menu.listPublic(); }
}
