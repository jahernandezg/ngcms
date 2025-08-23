import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import { Prisma, ThemeCategory, HeaderStyle, FooterStyle, ButtonStyle, CardStyle, ShadowStyle } from '@prisma/client';
import { CreateThemeDto, UpdateThemeDto } from './dto/theme-settings.dto';

@Injectable()
export class ThemesService {
  constructor(private prisma: PrismaService) {}

  // Get active theme with all fields
  getActive() { 
    return this.prisma.themeSettings.findFirst({ 
      where: { isActive: true } 
    }); 
  }

  // List all themes with basic info
  list() { 
    return this.prisma.themeSettings.findMany({
      orderBy: { updatedAt: 'desc' }
    }); 
  }

  // Get themes by category
  listByCategory(category: ThemeCategory) {
    return this.prisma.themeSettings.findMany({
      where: { category },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // Get theme by ID with all details
  async getById(id: string) {
    const theme = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!theme) throw new NotFoundException('Theme no encontrado');
    return theme;
  }

  // Create theme with extended properties
  async create(data: CreateThemeDto) {
    const sanitizedData = this.validateAndSanitize(data);
    
    return this.prisma.themeSettings.create({ 
      data: { 
        ...sanitizedData,
        isActive: false 
      } 
    });
  }

  // Update theme
  async update(id: string, data: UpdateThemeDto) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');

    const sanitizedData = this.validateAndSanitize(data);
    
    if (data.setActive) {
      // Update and activate in transaction
      return this.prisma.$transaction([
        this.prisma.themeSettings.updateMany({ data: { isActive: false }, where: { isActive: true } }),
        this.prisma.themeSettings.update({ where: { id }, data: { ...sanitizedData, isActive: true } })
      ]);
    }

    return this.prisma.themeSettings.update({ 
      where: { id }, 
      data: sanitizedData 
    });
  }

  // Set active theme
  async setActive(id: string) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
    
    return this.prisma.$transaction([
      this.prisma.themeSettings.updateMany({ data: { isActive: false }, where: { isActive: true } }),
      this.prisma.themeSettings.update({ where: { id }, data: { isActive: true } })
    ]);
  }

  // Legacy method: Update and activate in single transaction
  async updateAndActivate(id: string, data: UpdateThemeDto) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
    
    const sanitizedData = this.validateAndSanitize(data);
    
    return this.prisma.$transaction([
      this.prisma.themeSettings.updateMany({ data: { isActive: false }, where: { isActive: true } }),
      this.prisma.themeSettings.update({ where: { id }, data: { ...sanitizedData, isActive: true } })
    ]);
  }

  // Delete theme
  async delete(id: string) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
    
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
      
      await this.prisma.themeSettings.delete({ where: { id } });
      await this.prisma.themeSettings.update({ where: { id: candidates[0].id }, data: { isActive: true } });
      reassignedActive = candidates[0].id;
      return { id, deleted: true, reassignedActive };
    }
    
    await this.prisma.themeSettings.delete({ where: { id } });
    return { id, deleted: true, reassignedActive };
  }

  // Duplicate theme
  async duplicate(id: string) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');
    
    const baseName = existing.name + ' Copy';
    let finalName = baseName;
    let counter = 2;
    
    while (await this.prisma.themeSettings.findFirst({ where: { name: finalName } })) {
      finalName = baseName + ' ' + counter++;
    }
    
    // Create copy with all properties except id, createdAt, updatedAt, isActive
    const { id: _, createdAt, updatedAt, isActive, ...themeData } = existing;
    
    return this.prisma.themeSettings.create({ 
      data: { 
        ...themeData,
        name: finalName,
        isActive: false 
      } 
    });
  }

  // Legacy method: Update settings only
  updateSettings(id: string, data: UpdateThemeDto) {
    const sanitizedData = this.validateAndSanitize(data);
    return this.prisma.themeSettings.update({ where: { id }, data: sanitizedData });
  }

  // Create predefined themes for initial setup
  async createPredefinedThemes() {
    const predefinedThemes = this.getPredefinedThemes();
    const results = [];
    
    for (const theme of predefinedThemes) {
      try {
        const existing = await this.prisma.themeSettings.findFirst({ where: { name: theme.name } });
        if (!existing) {
          const created = await this.create(theme);
          results.push(created);
        }
      } catch (error) {
        console.warn(`Failed to create predefined theme ${theme.name}:`, error);
      }
    }
    
    return results;
  }

  // Get predefined theme definitions
  private getPredefinedThemes(): CreateThemeDto[] {
    return [
      {
        name: 'Modern Blue',
        description: 'Clean and modern design with blue accent',
        category: ThemeCategory.GENERAL,
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        accentColor: '#3b82f6',
        headerStyle: HeaderStyle.DEFAULT,
        footerStyle: FooterStyle.DEFAULT,
        buttonStyle: ButtonStyle.ROUNDED,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.SOFT,
      },
      {
        name: 'Business Professional',
        description: 'Professional theme for business websites',
        category: ThemeCategory.BUSINESS,
        primaryColor: '#1e40af',
        secondaryColor: '#374151',
        accentColor: '#f59e0b',
        headerStyle: HeaderStyle.CENTERED,
        footerStyle: FooterStyle.COLUMNS,
        buttonStyle: ButtonStyle.SQUARE,
        cardStyle: CardStyle.OUTLINED,
        shadowStyle: ShadowStyle.MEDIUM,
      },
      {
        name: 'Creative Portfolio',
        description: 'Creative and colorful theme for portfolios',
        category: ThemeCategory.PORTFOLIO,
        primaryColor: '#7c3aed',
        secondaryColor: '#6b7280',
        accentColor: '#f59e0b',
        headerStyle: HeaderStyle.MINIMAL,
        footerStyle: FooterStyle.MINIMAL,
        buttonStyle: ButtonStyle.PILL,
        cardStyle: CardStyle.GLASS,
        shadowStyle: ShadowStyle.COLORED,
      },
      {
        name: 'Minimal Blog',
        description: 'Clean and minimal theme perfect for blogs',
        category: ThemeCategory.BLOG,
        primaryColor: '#374151',
        secondaryColor: '#6b7280',
        accentColor: '#10b981',
        headerStyle: HeaderStyle.MINIMAL,
        footerStyle: FooterStyle.MINIMAL,
        buttonStyle: ButtonStyle.GHOST,
        cardStyle: CardStyle.MINIMAL,
        shadowStyle: ShadowStyle.NONE,
      },
      {
        name: 'Classic Elegant',
        description: 'Timeless and elegant design',
        category: ThemeCategory.GENERAL,
        primaryColor: '#1f2937',
        secondaryColor: '#4b5563',
        accentColor: '#d97706',
        headerStyle: HeaderStyle.DEFAULT,
        footerStyle: FooterStyle.CENTERED,
        buttonStyle: ButtonStyle.OUTLINED,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.SOFT,
      },
    ];
  }

  // Validation and sanitization
  private validateAndSanitize(data: Partial<CreateThemeDto | UpdateThemeDto>) {
    const result: Record<string, any> = {};
    
    // Copy all provided fields
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        result[key] = data[key as keyof typeof data];
      }
    });

    // Sanitize string fields
    if (result.name) result.name = result.name.toString().trim();
    if (result.description) result.description = result.description.toString().trim();
    
    // Validate and sanitize colors (basic hex validation)
    const colorFields = [
      'primaryColor', 'secondaryColor', 'accentColor', 'surfaceColor',
      'surfaceAltColor', 'textColor', 'textSecondary', 'borderColor',
      'errorColor', 'successColor', 'warningColor'
    ];
    
    colorFields.forEach(field => {
      if (result[field]) {
        const color = result[field].toString().trim();
        if (!color.match(/^#[0-9A-Fa-f]{6}$/)) {
          throw new BadRequestException(`Invalid color format for ${field}. Use hex format like #ffffff`);
        }
        result[field] = color;
      }
    });
    
    // Sanitize fonts
    if (result.fontHeading) result.fontHeading = result.fontHeading.toString().trim();
    if (result.fontBody) result.fontBody = result.fontBody.toString().trim();
    
    // Validate numbers
    if (result.fontScaleRatio !== undefined) {
      const ratio = parseFloat(result.fontScaleRatio);
      if (isNaN(ratio) || ratio < 1 || ratio > 2) {
        throw new BadRequestException('fontScaleRatio must be between 1 and 2');
      }
      result.fontScaleRatio = ratio;
    }
    
    if (result.lineHeightBase !== undefined) {
      const lineHeight = parseFloat(result.lineHeightBase);
      if (isNaN(lineHeight) || lineHeight < 1 || lineHeight > 3) {
        throw new BadRequestException('lineHeightBase must be between 1 and 3');
      }
      result.lineHeightBase = lineHeight;
    }
    
    // Sanitize custom CSS
    if (result.customCss) {
      let customCss = result.customCss.toString();
      if (customCss.length > 10000) {
        throw new BadRequestException('customCss is too long (max 10000 characters)');
      }
      
      // Remove potentially dangerous content
      customCss = customCss
        .replace(/@import[^;]+;?/gi, '') // Remove @import
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
        .trim();
        
      result.customCss = customCss;
    }
    
    return result;
  }
}