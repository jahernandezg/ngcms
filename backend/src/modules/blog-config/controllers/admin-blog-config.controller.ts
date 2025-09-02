import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { BlogConfigService } from '../blog-config.service';
import { UpdateBlogConfigDto } from '../dto/update-blog-config.dto';
import { JwtAuthGuard } from '../../admin/guards/jwt-auth.guard';
import { RolesGuard } from '../../admin/guards/roles.guard';
import { Roles } from '../../admin/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('blog-config')
export class AdminBlogConfigController {
  constructor(private svc: BlogConfigService) {}

  @Put()
  async update(@Body() dto: UpdateBlogConfigDto) { return this.svc.update(dto); }
}
