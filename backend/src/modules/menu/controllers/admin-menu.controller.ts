import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { MenuService } from '../menu.service';
import { JwtAuthGuard } from '../../admin/guards/jwt-auth.guard';
import { RolesGuard } from '../../admin/guards/roles.guard';
import { Roles } from '../../admin/decorators/roles.decorator';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../dto/menu-item.dto';

@Controller('admin/menu')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminMenuController {
  constructor(private menu: MenuService) {}

  @Get()
  list() { return this.menu.listAdmin(); }

  @Post('items')
  create(@Body() body: CreateMenuItemDto) { return this.menu.create(body); }

  @Put('items/:id')
  update(@Param('id') id: string, @Body() body: UpdateMenuItemDto) { return this.menu.update(id, body); }

  @Delete('items/:id')
  remove(@Param('id') id: string) { return this.menu.remove(id); }

  @Put('reorder')
  reorder(@Body() body: { order: { id: string; sortOrder: number; parentId?: string|null }[] }) { return this.menu.reorder(body.order); }
}
