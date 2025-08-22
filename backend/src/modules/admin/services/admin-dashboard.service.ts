import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [posts, published, users, recent] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.user.count(),
      this.prisma.post.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, createdAt: true, status: true } })
    ]);
    return { posts, published, users, recent };
  }
}
