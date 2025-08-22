import { Controller, Get, Param, Query, NotFoundException, Headers } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PostDetailDto, PostListItemDto } from '../../common/dto/docs.dto';
import { PostsService } from './posts.service';
import { GetPostsDto } from './dto/get-posts.dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOkResponse({ description: 'Listado paginado de posts publicados', type: [PostListItemDto] })
  async list(@Query() query: GetPostsDto, @Headers('x-skip-cache') skipCache?: string) {
    const { page, limit } = query;
    return this.postsService.findPublishedPaginated(page, limit, { skipCache: skipCache === '1' });
  }

  @Get('category/:slug')
  @ApiOkResponse({ description: 'Listado paginado por categoría', type: [PostListItemDto] })
  async byCategory(@Param('slug') slug: string, @Query() query: GetPostsDto) {
    const { page, limit } = query;
  const result = await this.postsService.findPublishedByCategorySlugPaginated(slug, page, limit);
  return { ...result, category: slug };
  }

  @Get('tag/:slug')
  @ApiOkResponse({ description: 'Listado paginado por tag', type: [PostListItemDto] })
  async byTag(@Param('slug') slug: string, @Query() query: GetPostsDto) {
    const { page, limit } = query;
  const result = await this.postsService.findPublishedByTagSlugPaginated(slug, page, limit);
  return { ...result, tag: slug };
  }

  @Get(':slug/related')
  @ApiOkResponse({ description: 'Posts relacionados', type: [PostListItemDto] })
  async related(@Param('slug') slug: string) {
  return this.postsService.findRelatedPostsBySlug(slug, 5);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Detalle del post', type: PostDetailDto })
  async bySlug(@Param('slug') slug: string) {
    const post = await this.postsService.findPublishedBySlugAndIncrement(slug);
    if (!post) throw new NotFoundException('Post not found');
  return post;
  }

  @Get('author/:id')
  @ApiOkResponse({ description: 'Listado paginado por autor', type: [PostListItemDto] })
  async byAuthor(@Param('id') id: string, @Query() query: GetPostsDto) {
    const { page, limit } = query;
    return this.postsService.findPublishedByAuthorPaginated(id, page, limit);
  }
}
