import { Body, Controller, Get, Param, Post, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { PagesService } from '../pages.service';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { JwtAuthGuard } from '../../admin/guards/jwt-auth.guard';
import { RolesGuard } from '../../admin/guards/roles.guard';
import { Roles } from '../../admin/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { PageStatus } from '@prisma/client';

interface AuthUser { sub: string; roles: string[]; }

@Controller('admin/pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN','AUTHOR')
export class AdminPagesController {
  constructor(private pages: PagesService) {}

  @Get()
  list(@Query('page') page='1', @Query('limit') limit='10', @Query('status') status?: PageStatus) {
    const p = Math.max(1, parseInt(page,10)||1); const l = Math.min(50, Math.max(1, parseInt(limit,10)||10));
    return this.pages.adminList(p,l,status);
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.pages.adminGet(id); }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePageDto) { return this.pages.create(user.sub, dto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) { return this.pages.update(id, dto); }

  @Put(':id/homepage')
  setHomepage(@Param('id') id: string) { return this.pages.setHomepage(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.pages.remove(id); }
}
