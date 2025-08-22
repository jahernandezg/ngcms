import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PostListItemDto } from '../../common/dto/docs.dto';
import { SearchService } from './search.service';
import { SearchQueryDto, SuggestQueryDto } from './dto/search.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('posts')
  @ApiOkResponse({ description: 'Resultados de búsqueda paginados', type: [PostListItemDto] })
  async searchPosts(@Query() query: SearchQueryDto) {
    const { q, page, limit } = query;
  const result = await this.searchService.searchPosts(q, page, limit);
  return { ...result, q };
  }

  @Get('suggest')
  @ApiOkResponse({ description: 'Sugerencias de títulos y tags' })
  async suggest(@Query() query: SuggestQueryDto) {
    const { q, limit } = query;
  return this.searchService.suggest(q, limit);
  }
}
