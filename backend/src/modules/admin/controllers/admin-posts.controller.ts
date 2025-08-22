import { Body, Controller, Delete, Get, Param, Post as HttpPost, Put, UseGuards, Query } from '@nestjs/common';
import { AdminPostsService } from '../services/admin-posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { OwnershipGuard } from '../guards/ownership.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiCreatedResponse, ApiForbiddenResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Post as PrismaPost, PostStatus } from '@prisma/client';

class PostEntity implements Partial<PrismaPost> {
  id!: string; title!: string; slug!: string; content!: string; status!: PostStatus; authorId!: string; createdAt!: Date; updatedAt!: Date; version!: number;
}

interface AuthUser { sub: string; email: string; roles: string[]; }

@ApiTags('admin-posts')
@ApiBearerAuth()
@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN','AUTHOR')
export class AdminPostsController {
  constructor(private posts: AdminPostsService) {}

  @Get()
  @ApiOkResponse({ description: 'Listado de posts (scoped)', type: [PostEntity] })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: PostStatus,
    @Query('category') categorySlug?: string,
    @Query('tag') tagSlug?: string,
    @Query('q') q?: string
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    return this.posts.findAll(user.roles.includes('ADMIN') ? undefined : user.sub, p, l, status, { categorySlug, tagSlug, q });
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalle', type: PostEntity })
  @ApiNotFoundResponse({ description: 'No existe' })
  async get(@Param('id') id: string) { return this.posts.findOne(id); }

  @HttpPost()
  @ApiCreatedResponse({ description: 'Creado', type: PostEntity })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.posts.create(user.sub, dto);
  }

  @UseGuards(OwnershipGuard)
  @Put(':id')
  @ApiOkResponse({ description: 'Actualizado', type: PostEntity })
  @ApiForbiddenResponse({ description: 'Ownership violada' })
  @ApiNotFoundResponse({ description: 'No existe' })
  async update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdatePostDto) {
    return this.posts.update(id, user.sub, dto);
  }

  @UseGuards(OwnershipGuard)
  @Delete(':id')
  @ApiOkResponse({ description: 'Eliminado', schema: { properties: { deleted: { type: 'boolean' } } } })
  @ApiForbiddenResponse({ description: 'Ownership violada' })
  @ApiNotFoundResponse({ description: 'No existe' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.remove(id, user.sub);
  }
}
