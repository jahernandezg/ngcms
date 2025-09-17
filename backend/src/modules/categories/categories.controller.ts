import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryDto } from '../../common/dto/docs.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('tree')
  tree() {
    return this.categoriesService.listTree();
  }

  @Get()
  @ApiOkResponse({ description: 'Listado de todas las categorías', type: [CategoryDto] })
  list() {
    return this.categoriesService.listAll();
  }
}
