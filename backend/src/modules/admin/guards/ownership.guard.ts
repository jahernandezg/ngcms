import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { sub: string; roles: string[] } | undefined;
    if (!user) throw new ForbiddenException();
    if (user.roles?.includes('ADMIN')) return true;
    const id = req.params?.id;
    if (!id) return true;
    const post = await this.prisma.post.findUnique({ where: { id }, select: { authorId: true } });
    if (!post) throw new NotFoundException();
    if (post.authorId !== user.sub) throw new ForbiddenException('Not owner');
    return true;
  }
}
