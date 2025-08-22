import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from '../posts/posts.service';
import { GetPostsDto } from '../posts/dto/get-posts.dto';
import { PostListItemDto, PostDetailDto } from '../../common/dto/docs.dto';
import { SearchService } from '../search/search.service';
import { SearchQueryDto } from '../search/dto/search.dto';

@ApiTags('public')
@Controller()
export class PublicController {
  constructor(private posts: PostsService, private search: SearchService) {}

  @Get('category/:slug')
  @ApiOkResponse({ description: 'Listado por categoría', type: [PostListItemDto] })
  async category(@Param('slug') slug: string, @Query() query: GetPostsDto) {
    const { page, limit } = query;
    return this.posts.findPublishedByCategorySlugPaginated(slug, page, limit);
  }

  @Get('tag/:slug')
  @ApiOkResponse({ description: 'Listado por tag', type: [PostListItemDto] })
  async tag(@Param('slug') slug: string, @Query() query: GetPostsDto) {
    const { page, limit } = query;
    return this.posts.findPublishedByTagSlugPaginated(slug, page, limit);
  }

  @Get('author/:slug')
  @ApiOkResponse({ description: 'Listado por autor (slug)', type: [PostListItemDto] })
  async author(@Param('slug') slug: string, @Query() query: GetPostsDto) {
    const { page, limit } = query;
    return this.posts.findPublishedByAuthorPaginated(slug, page, limit);
  }

  @Get('search')
  @ApiOkResponse({ description: 'Búsqueda básica', type: [PostListItemDto] })
  async searchPosts(@Query() query: SearchQueryDto) {
    const { q, page, limit } = query;
    const result = await this.search.searchPosts(q, page, limit);
    return { ...result, q };
  }

  @Get('posts/:slug')
  @ApiOkResponse({ description: 'Detalle del post', type: PostDetailDto })
  async postDetail(@Param('slug') slug: string) {
    const post = await this.posts.findPublishedBySlugAndIncrement(slug);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}
