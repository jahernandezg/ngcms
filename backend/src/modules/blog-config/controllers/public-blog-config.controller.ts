import { Controller, Get } from '@nestjs/common';
import { BlogConfigService } from '../blog-config.service';

@Controller('blog-config')
export class PublicBlogConfigController {
  constructor(private svc: BlogConfigService) {}

  @Get()
  async get() { return this.svc.get(); }
}
