import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.tag.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } });
  }
}
