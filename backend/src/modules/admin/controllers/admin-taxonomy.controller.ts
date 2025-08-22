import { Controller, Get, UseGuards, Post, Body, Put, Param, Delete, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { IsOptional, IsString, MinLength } from 'class-validator';

class CreateCategoryDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() parentSlug?: string;
}
class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() parentSlug?: string;
}
class CreateTagDto { @IsString() @MinLength(2) name!: string; }
class UpdateTagDto { @IsOptional() @IsString() @MinLength(2) name?: string; }

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0,60);
}

@ApiTags('admin-taxonomy')
@ApiBearerAuth()
@Controller('admin/taxonomy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN','AUTHOR')
export class AdminTaxonomyController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // Categories CRUD
  @Get('categories')
  @ApiOkResponse({ description: 'Listado de categorías' })
  async categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, parentId: true } });
  }
  @Get('categories/:slug')
  async category(@Param('slug') slug: string) {
    const c = await this.prisma.category.findUnique({ where: { slug }, select: { id: true, name: true, slug: true, parentId: true } });
    if (!c) throw new NotFoundException();
    return c;
  }
  @Post('categories')
  @ApiCreatedResponse({ description: 'Categoría creada' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    let parentId: string | undefined;
    if (dto.parentSlug) {
      const parent = await this.prisma.category.findUnique({ where: { slug: dto.parentSlug }, select: { id: true } });
      if (!parent) throw new NotFoundException('Parent no existe');
      parentId = parent.id;
    }
    try {
      const created = await this.prisma.category.create({ data: { name: dto.name, slug, parentId } });
      await this.audit.log({ action: 'CREATE', resource: 'Category', resourceId: created.id });
      return created;
    } catch (e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('Slug ya existe');
      throw e;
    }
  }
  @Put('categories/:slug')
  async updateCategory(@Param('slug') slug: string, @Body() dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) throw new NotFoundException();
    let parentId: string | undefined | null;
    if (dto.parentSlug !== undefined) {
      if (dto.parentSlug === '') parentId = null; else {
        const parent = await this.prisma.category.findUnique({ where: { slug: dto.parentSlug }, select: { id: true } });
        if (!parent) throw new NotFoundException('Parent no existe');
        parentId = parent.id;
      }
    }
    const updated = await this.prisma.category.update({ where: { slug }, data: { ...(dto.name ? { name: dto.name } : {}), ...(parentId !== undefined ? { parentId } : {}) } });
    await this.audit.log({ action: 'UPDATE', resource: 'Category', resourceId: updated.id });
    return updated;
  }
  @Delete('categories/:slug')
  async deleteCategory(@Param('slug') slug: string) {
    const existing = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) throw new NotFoundException();
    await this.prisma.category.delete({ where: { slug } });
    await this.audit.log({ action: 'DELETE', resource: 'Category', resourceId: existing.id });
    return { deleted: true };
  }

  // Tags CRUD
  @Get('tags')
  @ApiOkResponse({ description: 'Listado de tags' })
  async tags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } });
  }
  @Get('tags/:slug')
  async tag(@Param('slug') slug: string) {
    const t = await this.prisma.tag.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
    if (!t) throw new NotFoundException();
    return t;
  }
  @Post('tags')
  @ApiCreatedResponse({ description: 'Tag creado' })
  async createTag(@Body() dto: CreateTagDto) {
    const slug = slugify(dto.name);
    try {
      const created = await this.prisma.tag.create({ data: { name: dto.name, slug } });
      await this.audit.log({ action: 'CREATE', resource: 'Tag', resourceId: created.id });
      return created;
    } catch (e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('Slug ya existe');
      throw e;
    }
  }
  @Put('tags/:slug')
  async updateTag(@Param('slug') slug: string, @Body() dto: UpdateTagDto) {
    const existing = await this.prisma.tag.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) throw new NotFoundException();
    const updated = await this.prisma.tag.update({ where: { slug }, data: { ...(dto.name ? { name: dto.name } : {}) } });
    await this.audit.log({ action: 'UPDATE', resource: 'Tag', resourceId: updated.id });
    return updated;
  }
  @Delete('tags/:slug')
  async deleteTag(@Param('slug') slug: string) {
    const existing = await this.prisma.tag.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) throw new NotFoundException();
    await this.prisma.tag.delete({ where: { slug } });
    await this.audit.log({ action: 'DELETE', resource: 'Tag', resourceId: existing.id });
    return { deleted: true };
  }
}
