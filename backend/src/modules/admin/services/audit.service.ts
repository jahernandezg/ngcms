import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}
  async log(params: { userId?: string; action: string; resource: string; resourceId: string }) {
    await this.prisma.auditLog.create({ data: { ...params } });
  }
}
