import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  listTree() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true, slug: true, children: { select: { id: true, name: true, slug: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
