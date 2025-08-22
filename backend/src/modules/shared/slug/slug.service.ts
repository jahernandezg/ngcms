import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';

@Injectable()
export class SlugService {
  constructor(private prisma: PrismaService) {}

  /** Verifica unicidad de slug entre posts y pages. Lanza BadRequest si ya existe. */
  async assertUnique(slug: string, opts?: { ignorePageId?: string; ignorePostId?: string }) {
    const existingPost = await this.prisma.post.findUnique({ where: { slug } });
    if (existingPost && existingPost.id !== opts?.ignorePostId) {
      throw new BadRequestException('Slug ya utilizado por un post');
    }
  const existingPage = await this.prisma.page.findUnique({ where: { slug } });
    if (existingPage && existingPage.id !== opts?.ignorePageId) {
      throw new BadRequestException('Slug ya utilizado por una página');
    }
  }
}
