import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { PostStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // TODO(Wave2): cambiar a slug cuando migración DB aplicada
  listAuthors() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, bio: true, avatarUrl: true, _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async authorDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        posts: {
          where: { status: PostStatus.PUBLISHED },
          orderBy: { publishedAt: 'desc' },
          select: { id: true, title: true, slug: true, excerpt: true, readingTime: true, publishedAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Author not found');
    return user;
  }
}
