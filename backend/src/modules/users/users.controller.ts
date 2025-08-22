import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('authors')
@Controller('authors')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.listAuthors();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.usersService.authorDetail(id);
  }
}
