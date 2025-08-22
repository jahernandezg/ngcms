import { Body, Controller, Get, Param, Put, Post, Delete, UseGuards } from '@nestjs/common';
import { ThemesService } from '../themes.service';
import { JwtAuthGuard } from '../../admin/guards/jwt-auth.guard';
import { RolesGuard } from '../../admin/guards/roles.guard';
import { Roles } from '../../admin/decorators/roles.decorator';
import { Prisma } from '@prisma/client';

@Controller('admin/themes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminThemesController {
  constructor(private themes: ThemesService) {}

  @Get()
  list() { return this.themes.list(); }

  @Post()
  create(@Body() body: { name: string; primaryColor?: string; secondaryColor?: string; customCss?: string }) {
    return this.themes.create(body);
  }

  @Put(':id/active')
  setActive(@Param('id') id: string) { return this.themes.setActive(id); }

  @Put(':id/settings')
  updateSettings(@Param('id') id: string, @Body() body: { primaryColor?: string; secondaryColor?: string; customCss?: string; settings?: Prisma.JsonValue }) { return this.themes.updateSettings(id, body); }

  @Put(':id/settings-activate')
  updateSettingsAndActivate(@Param('id') id: string, @Body() body: { primaryColor?: string; secondaryColor?: string; customCss?: string; settings?: Prisma.JsonValue }) { return this.themes.updateAndActivate(id, body); }

  @Delete(':id')
  delete(@Param('id') id: string) { return this.themes.delete(id); }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) { return this.themes.duplicate(id); }
}
