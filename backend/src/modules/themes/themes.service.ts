import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ThemesService {
  constructor(private prisma: PrismaService) {}

  getActive() { return this.prisma.themeSettings.findFirst({ where: { isActive: true } }); }
  list() { return this.prisma.themeSettings.findMany(); }

  create(data: { name: string; primaryColor?: string; secondaryColor?: string; customCss?: string }) {
  const { primaryColor, secondaryColor, customCss } = this.validateAndSanitize(data);
  return this.prisma.themeSettings.create({ data: { name: data.name, primaryColor, secondaryColor, customCss, isActive: false } });
  }

  async setActive(id: string) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
    return this.prisma.$transaction([
      this.prisma.themeSettings.updateMany({ data: { isActive: false }, where: { isActive: true } }),
      this.prisma.themeSettings.update({ where: { id }, data: { isActive: true } })
    ]);
  }

  async updateAndActivate(id: string, data: { primaryColor?: string; secondaryColor?: string; customCss?: string; settings?: Prisma.JsonValue }) {
    // Actualiza settings y activa en una sola transacción
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
    const validated = this.validateAndSanitize(data);
    const updateData: Record<string, unknown> = {};
    if (data.primaryColor !== undefined) updateData.primaryColor = validated.primaryColor;
    if (data.secondaryColor !== undefined) updateData.secondaryColor = validated.secondaryColor;
    if (data.customCss !== undefined) updateData.customCss = validated.customCss;
    if (data.settings !== undefined) updateData.settings = data.settings;
    return this.prisma.$transaction([
      this.prisma.themeSettings.updateMany({ data: { isActive: false }, where: { isActive: true } }),
      this.prisma.themeSettings.update({ where: { id }, data: { ...updateData, isActive: true } })
    ]);
  }

  async delete(id: string) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
    // Si es activo, necesitamos saber si hay otros y quizá reasignar
    let reassignedActive: string | null = null;
    if (existing.isActive) {
      const candidates = await this.prisma.themeSettings.findMany({
        where: { id: { not: id } },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      });
      if (candidates.length === 0) {
        throw new BadRequestException('No se puede eliminar el único tema existente');
      }
      // Borramos y luego marcamos el primero como activo
      await this.prisma.themeSettings.delete({ where: { id } });
      await this.prisma.themeSettings.update({ where: { id: candidates[0].id }, data: { isActive: true } });
      reassignedActive = candidates[0].id;
      return { id, deleted: true, reassignedActive };
    }
    await this.prisma.themeSettings.delete({ where: { id } });
    return { id, deleted: true, reassignedActive };
  }

  async duplicate(id: string) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
  const baseName = existing.name + ' Copy';
    let finalName = baseName;
    let counter = 2;
    while (await this.prisma.themeSettings.findFirst({ where: { name: finalName } })) {
      finalName = baseName + ' ' + counter++;
    }
    return this.prisma.themeSettings.create({ data: { name: finalName, primaryColor: existing.primaryColor || undefined, secondaryColor: existing.secondaryColor || undefined, customCss: existing.customCss || undefined, isActive: false } });
  }

  updateSettings(id: string, data: { primaryColor?: string; secondaryColor?: string; customCss?: string; settings?: Prisma.JsonValue }) {
    const updateData: Record<string, unknown> = {};
    const validated = this.validateAndSanitize(data);
    if (data.primaryColor !== undefined) updateData.primaryColor = validated.primaryColor;
    if (data.secondaryColor !== undefined) updateData.secondaryColor = validated.secondaryColor;
    if (data.customCss !== undefined) updateData.customCss = validated.customCss;
    if (data.settings !== undefined) updateData.settings = data.settings;
    return this.prisma.themeSettings.update({ where: { id }, data: updateData });
  }

  private validateAndSanitize(data: { primaryColor?: string; secondaryColor?: string; customCss?: string }) {
  const norm = (v?: string) => v ? v.trim() : undefined; // sin validación estricta
  const primaryColor = norm(data.primaryColor);
  const secondaryColor = norm(data.secondaryColor);
    let customCss = data.customCss;
    if (customCss) {
      if (customCss.length > 8000) throw new Error('customCss demasiado largo');
      customCss = customCss
        .replace(/@import[^;]+;?/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .trim();
    }
    return { primaryColor, secondaryColor, customCss };
  }
}
