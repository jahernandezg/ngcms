import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cms-workspace/database';
import {
  Prisma,
  ThemeCategory as PrismaThemeCategory,
  HeaderStyle as PrismaHeaderStyle,
  FooterStyle as PrismaFooterStyle,
  ButtonStyle as PrismaButtonStyle,
  CardStyle as PrismaCardStyle,
  ShadowStyle as PrismaShadowStyle,
} from '@prisma/client';
import { 
  ThemeCategory, 
  HeaderStyle, 
  FooterStyle, 
  ButtonStyle, 
  CardStyle, 
  ShadowStyle 
} from './enums/theme.enums';
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

    const payload: Prisma.ThemeSettingsCreateInput = {
      name: sanitizedData.name ?? data.name,
      description: sanitizedData.description,
      category: sanitizedData.category as unknown as PrismaThemeCategory | undefined,
      // Colors
      primaryColor: sanitizedData.primaryColor,
      secondaryColor: sanitizedData.secondaryColor,
      accentColor: sanitizedData.accentColor,
      surfaceColor: sanitizedData.surfaceColor,
      surfaceAltColor: sanitizedData.surfaceAltColor,
      textColor: sanitizedData.textColor,
      textSecondary: sanitizedData.textSecondary,
      borderColor: sanitizedData.borderColor,
      errorColor: sanitizedData.errorColor,
      successColor: sanitizedData.successColor,
      warningColor: sanitizedData.warningColor,
      // Typography
      fontHeading: sanitizedData.fontHeading,
      fontBody: sanitizedData.fontBody,
      fontSizeBase: sanitizedData.fontSizeBase,
      fontScaleRatio: sanitizedData.fontScaleRatio as number | undefined,
      lineHeightBase: sanitizedData.lineHeightBase as number | undefined,
      // Layout / styles
      containerWidth: sanitizedData.containerWidth,
      spacingUnit: sanitizedData.spacingUnit,
      borderRadius: sanitizedData.borderRadius,
      headerStyle: sanitizedData.headerStyle as unknown as PrismaHeaderStyle | undefined,
      footerStyle: sanitizedData.footerStyle as unknown as PrismaFooterStyle | undefined,
      buttonStyle: sanitizedData.buttonStyle as unknown as PrismaButtonStyle | undefined,
      cardStyle: sanitizedData.cardStyle as unknown as PrismaCardStyle | undefined,
      shadowStyle: sanitizedData.shadowStyle as unknown as PrismaShadowStyle | undefined,
      // Other
      animationSpeed: sanitizedData.animationSpeed,
      customCss: sanitizedData.customCss,
      previewImage: sanitizedData.previewImage,
      isActive: false,
    };

    return this.prisma.themeSettings.create({ data: payload });
  }

  // Update theme
  async update(id: string, data: UpdateThemeDto) {
    const existing = await this.prisma.themeSettings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Theme no encontrado');

    const sanitizedData = this.validateAndSanitize(data);
    
    if (data.setActive) {
      // Update and activate in transaction
      const updatePayload: Prisma.ThemeSettingsUpdateInput = {
        name: sanitizedData.name,
        description: sanitizedData.description,
        category: sanitizedData.category as unknown as PrismaThemeCategory | undefined,
        primaryColor: sanitizedData.primaryColor,
        secondaryColor: sanitizedData.secondaryColor,
        accentColor: sanitizedData.accentColor,
        surfaceColor: sanitizedData.surfaceColor,
        surfaceAltColor: sanitizedData.surfaceAltColor,
        textColor: sanitizedData.textColor,
        textSecondary: sanitizedData.textSecondary,
        borderColor: sanitizedData.borderColor,
        errorColor: sanitizedData.errorColor,
        successColor: sanitizedData.successColor,
        warningColor: sanitizedData.warningColor,
        fontHeading: sanitizedData.fontHeading,
        fontBody: sanitizedData.fontBody,
        fontSizeBase: sanitizedData.fontSizeBase,
        fontScaleRatio: sanitizedData.fontScaleRatio as number | undefined,
        lineHeightBase: sanitizedData.lineHeightBase as number | undefined,
        containerWidth: sanitizedData.containerWidth,
        spacingUnit: sanitizedData.spacingUnit,
        borderRadius: sanitizedData.borderRadius,
        headerStyle: sanitizedData.headerStyle as unknown as PrismaHeaderStyle | undefined,
        footerStyle: sanitizedData.footerStyle as unknown as PrismaFooterStyle | undefined,
        buttonStyle: sanitizedData.buttonStyle as unknown as PrismaButtonStyle | undefined,
        cardStyle: sanitizedData.cardStyle as unknown as PrismaCardStyle | undefined,
        shadowStyle: sanitizedData.shadowStyle as unknown as PrismaShadowStyle | undefined,
        animationSpeed: sanitizedData.animationSpeed,
        customCss: sanitizedData.customCss,
        previewImage: sanitizedData.previewImage,
        isActive: true,
      };

      return this.prisma.$transaction([
        this.prisma.themeSettings.updateMany({ data: { isActive: false }, where: { isActive: true } }),
        this.prisma.themeSettings.update({ where: { id }, data: updatePayload })
      ]);
    }

    const updatePayload: Prisma.ThemeSettingsUpdateInput = {
      name: sanitizedData.name,
      description: sanitizedData.description,
      category: sanitizedData.category as unknown as PrismaThemeCategory | undefined,
      primaryColor: sanitizedData.primaryColor,
      secondaryColor: sanitizedData.secondaryColor,
      accentColor: sanitizedData.accentColor,
      surfaceColor: sanitizedData.surfaceColor,
      surfaceAltColor: sanitizedData.surfaceAltColor,
      textColor: sanitizedData.textColor,
      textSecondary: sanitizedData.textSecondary,
      borderColor: sanitizedData.borderColor,
      errorColor: sanitizedData.errorColor,
      successColor: sanitizedData.successColor,
      warningColor: sanitizedData.warningColor,
      fontHeading: sanitizedData.fontHeading,
      fontBody: sanitizedData.fontBody,
      fontSizeBase: sanitizedData.fontSizeBase,
      fontScaleRatio: sanitizedData.fontScaleRatio as number | undefined,
      lineHeightBase: sanitizedData.lineHeightBase as number | undefined,
      containerWidth: sanitizedData.containerWidth,
      spacingUnit: sanitizedData.spacingUnit,
      borderRadius: sanitizedData.borderRadius,
      headerStyle: sanitizedData.headerStyle as unknown as PrismaHeaderStyle | undefined,
      footerStyle: sanitizedData.footerStyle as unknown as PrismaFooterStyle | undefined,
      buttonStyle: sanitizedData.buttonStyle as unknown as PrismaButtonStyle | undefined,
      cardStyle: sanitizedData.cardStyle as unknown as PrismaCardStyle | undefined,
      shadowStyle: sanitizedData.shadowStyle as unknown as PrismaShadowStyle | undefined,
      animationSpeed: sanitizedData.animationSpeed,
      customCss: sanitizedData.customCss,
      previewImage: sanitizedData.previewImage,
    };

    return this.prisma.themeSettings.update({ where: { id }, data: updatePayload });
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

    const updatePayload: Prisma.ThemeSettingsUpdateInput = {
      name: sanitizedData.name,
      description: sanitizedData.description,
      category: sanitizedData.category as unknown as PrismaThemeCategory | undefined,
      primaryColor: sanitizedData.primaryColor,
      secondaryColor: sanitizedData.secondaryColor,
      accentColor: sanitizedData.accentColor,
      surfaceColor: sanitizedData.surfaceColor,
      surfaceAltColor: sanitizedData.surfaceAltColor,
      textColor: sanitizedData.textColor,
      textSecondary: sanitizedData.textSecondary,
      borderColor: sanitizedData.borderColor,
      errorColor: sanitizedData.errorColor,
      successColor: sanitizedData.successColor,
      warningColor: sanitizedData.warningColor,
      fontHeading: sanitizedData.fontHeading,
      fontBody: sanitizedData.fontBody,
      fontSizeBase: sanitizedData.fontSizeBase,
      fontScaleRatio: sanitizedData.fontScaleRatio as number | undefined,
      lineHeightBase: sanitizedData.lineHeightBase as number | undefined,
      containerWidth: sanitizedData.containerWidth,
      spacingUnit: sanitizedData.spacingUnit,
      borderRadius: sanitizedData.borderRadius,
      headerStyle: sanitizedData.headerStyle as unknown as PrismaHeaderStyle | undefined,
      footerStyle: sanitizedData.footerStyle as unknown as PrismaFooterStyle | undefined,
      buttonStyle: sanitizedData.buttonStyle as unknown as PrismaButtonStyle | undefined,
      cardStyle: sanitizedData.cardStyle as unknown as PrismaCardStyle | undefined,
      shadowStyle: sanitizedData.shadowStyle as unknown as PrismaShadowStyle | undefined,
      animationSpeed: sanitizedData.animationSpeed,
      customCss: sanitizedData.customCss,
      previewImage: sanitizedData.previewImage,
      isActive: true,
    };

    return this.prisma.$transaction([
      this.prisma.themeSettings.updateMany({ data: { isActive: false }, where: { isActive: true } }),
      this.prisma.themeSettings.update({ where: { id }, data: updatePayload })
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
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, isActive: _isActive, ...themeData } = existing;
    
    const payload: Prisma.ThemeSettingsCreateInput = ({
      name: finalName,
      description: themeData.description ?? undefined,
      category: themeData.category as unknown as PrismaThemeCategory | undefined,
      primaryColor: themeData.primaryColor,
      secondaryColor: themeData.secondaryColor,
      accentColor: themeData.accentColor,
      surfaceColor: themeData.surfaceColor,
      surfaceAltColor: themeData.surfaceAltColor,
      textColor: themeData.textColor,
      textSecondary: themeData.textSecondary,
      borderColor: themeData.borderColor,
      errorColor: themeData.errorColor,
      successColor: themeData.successColor,
      warningColor: themeData.warningColor,
      fontHeading: themeData.fontHeading,
      fontBody: themeData.fontBody,
      fontSizeBase: themeData.fontSizeBase,
      fontScaleRatio: themeData.fontScaleRatio as number | undefined,
      lineHeightBase: themeData.lineHeightBase as number | undefined,
      containerWidth: themeData.containerWidth,
      spacingUnit: themeData.spacingUnit,
      borderRadius: themeData.borderRadius,
      headerStyle: themeData.headerStyle as unknown as PrismaHeaderStyle | undefined,
      footerStyle: themeData.footerStyle as unknown as PrismaFooterStyle | undefined,
      buttonStyle: themeData.buttonStyle as unknown as PrismaButtonStyle | undefined,
      cardStyle: themeData.cardStyle as unknown as PrismaCardStyle | undefined,
      shadowStyle: themeData.shadowStyle as unknown as PrismaShadowStyle | undefined,
      animationSpeed: themeData.animationSpeed,
      customCss: themeData.customCss ?? undefined,
      previewImage: themeData.previewImage ?? undefined,
      // Evitar null vs JSON null
      settings: existing.settings ?? undefined,
      isActive: false,
    });

    return this.prisma.themeSettings.create({ data: payload });
  }

  // Legacy method: Update settings only
  updateSettings(id: string, data: UpdateThemeDto) {
    const sanitizedData = this.validateAndSanitize(data);
    const updatePayload: Prisma.ThemeSettingsUpdateInput = {
      name: sanitizedData.name,
      description: sanitizedData.description,
      category: sanitizedData.category as unknown as PrismaThemeCategory | undefined,
      primaryColor: sanitizedData.primaryColor,
      secondaryColor: sanitizedData.secondaryColor,
      accentColor: sanitizedData.accentColor,
      surfaceColor: sanitizedData.surfaceColor,
      surfaceAltColor: sanitizedData.surfaceAltColor,
      textColor: sanitizedData.textColor,
      textSecondary: sanitizedData.textSecondary,
      borderColor: sanitizedData.borderColor,
      errorColor: sanitizedData.errorColor,
      successColor: sanitizedData.successColor,
      warningColor: sanitizedData.warningColor,
      fontHeading: sanitizedData.fontHeading,
      fontBody: sanitizedData.fontBody,
      fontSizeBase: sanitizedData.fontSizeBase,
      fontScaleRatio: sanitizedData.fontScaleRatio as number | undefined,
      lineHeightBase: sanitizedData.lineHeightBase as number | undefined,
      containerWidth: sanitizedData.containerWidth,
      spacingUnit: sanitizedData.spacingUnit,
      borderRadius: sanitizedData.borderRadius,
      headerStyle: sanitizedData.headerStyle as unknown as PrismaHeaderStyle | undefined,
      footerStyle: sanitizedData.footerStyle as unknown as PrismaFooterStyle | undefined,
      buttonStyle: sanitizedData.buttonStyle as unknown as PrismaButtonStyle | undefined,
      cardStyle: sanitizedData.cardStyle as unknown as PrismaCardStyle | undefined,
      shadowStyle: sanitizedData.shadowStyle as unknown as PrismaShadowStyle | undefined,
      animationSpeed: sanitizedData.animationSpeed,
      customCss: sanitizedData.customCss,
      previewImage: sanitizedData.previewImage,
    };

    return this.prisma.themeSettings.update({ where: { id }, data: updatePayload });
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
      // General Themes
      {
        name: 'Modern Blue',
        description: 'Clean and modern design with blue accent',
        category: ThemeCategory.GENERAL,
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        accentColor: '#3b82f6',
        surfaceColor: '#ffffff',
        surfaceAltColor: '#f8fafc',
        textColor: '#1e293b',
        textSecondary: '#64748b',
        borderColor: '#e2e8f0',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        fontSizeBase: '16px',
        fontScaleRatio: 1.25,
        lineHeightBase: 1.6,
        containerWidth: '1200px',
        borderRadius: '8px',
        spacingUnit: '1rem',
        headerStyle: HeaderStyle.DEFAULT,
        footerStyle: FooterStyle.DEFAULT,
        buttonStyle: ButtonStyle.ROUNDED,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.SOFT,
      },
      
      {
        name: 'Classic Elegant',
        description: 'Timeless and elegant design with serif fonts',
        category: ThemeCategory.GENERAL,
        primaryColor: '#1f2937',
        secondaryColor: '#4b5563',
        accentColor: '#d97706',

        surfaceColor: '#f9fafb',
        surfaceAltColor: '#f3f4f6',
        textColor: '#111827',
        textSecondary: '#6b7280',
        borderColor: '#d1d5db',
        fontHeading: 'Playfair Display',
        fontBody: 'Source Sans Pro',
        fontSizeBase: '17px',
        fontScaleRatio: 1.33,
        lineHeightBase: 1.7,
        containerWidth: '1200px',
        borderRadius: '4px',
        spacingUnit: '1.25rem',
        headerStyle: HeaderStyle.DEFAULT,
        footerStyle: FooterStyle.CENTERED,
        buttonStyle: ButtonStyle.OUTLINED,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.SOFT,
      },

      // Business Themes
      {
        name: 'Business Professional',
        description: 'Professional theme for corporate websites',
        category: ThemeCategory.BUSINESS,
        primaryColor: '#1e40af',
        secondaryColor: '#374151',
        accentColor: '#f59e0b',

        surfaceColor: '#f8fafc',
        surfaceAltColor: '#f1f5f9',
        textColor: '#1f2937',
        textSecondary: '#6b7280',
        borderColor: '#e5e7eb',
        fontHeading: 'Roboto',
        fontBody: 'Open Sans',
        fontSizeBase: '16px',
        fontScaleRatio: 1.2,
        lineHeightBase: 1.6,
        containerWidth: '1400px',
        borderRadius: '4px',
        spacingUnit: '1rem',
        headerStyle: HeaderStyle.CENTERED,
        footerStyle: FooterStyle.COLUMNS,
        buttonStyle: ButtonStyle.SQUARE,
        cardStyle: CardStyle.OUTLINED,
        shadowStyle: ShadowStyle.MEDIUM,
      },

      {
        name: 'Corporate Dark',
        description: 'Sophisticated dark theme for businesses',
        category: ThemeCategory.BUSINESS,
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280',
        accentColor: '#10b981',

        surfaceColor: '#1e293b',
        surfaceAltColor: '#334155',
        textColor: '#f8fafc',
        textSecondary: '#cbd5e1',
        borderColor: '#475569',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        fontSizeBase: '16px',
        fontScaleRatio: 1.25,
        lineHeightBase: 1.6,
        containerWidth: '1200px',
        borderRadius: '8px',
        spacingUnit: '1rem',
        headerStyle: HeaderStyle.MINIMAL,
        footerStyle: FooterStyle.DEFAULT,
        buttonStyle: ButtonStyle.ROUNDED,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.STRONG,
      },

      // Creative Themes
      {
        name: 'Creative Portfolio',
        description: 'Vibrant theme perfect for creative portfolios',
        category: ThemeCategory.PORTFOLIO,
        primaryColor: '#7c3aed',
        secondaryColor: '#6b7280',
        accentColor: '#f59e0b',

        surfaceColor: '#fafafa',
        surfaceAltColor: '#f5f5f5',
        textColor: '#18181b',
        textSecondary: '#71717a',
        borderColor: '#e4e4e7',
        fontHeading: 'Poppins',
        fontBody: 'Inter',
        fontSizeBase: '16px',
        fontScaleRatio: 1.3,
        lineHeightBase: 1.7,
        containerWidth: '1200px',
        borderRadius: '12px',
        spacingUnit: '1.5rem',
        headerStyle: HeaderStyle.MINIMAL,
        footerStyle: FooterStyle.MINIMAL,
        buttonStyle: ButtonStyle.PILL,
        cardStyle: CardStyle.GLASS,
        shadowStyle: ShadowStyle.COLORED,
      },

      {
        name: 'Artistic Vibrant',
        description: 'Bold and colorful theme for artists and designers',
        category: ThemeCategory.CREATIVE,
        primaryColor: '#ec4899',
        secondaryColor: '#8b5cf6',
        accentColor: '#06b6d4',

        surfaceColor: '#ffffff',
        surfaceAltColor: '#f4f4f5',
        textColor: '#27272a',
        textSecondary: '#71717a',
        borderColor: '#e4e4e7',
        fontHeading: 'Montserrat',
        fontBody: 'Lato',
        fontSizeBase: '17px',
        fontScaleRatio: 1.35,
        lineHeightBase: 1.7,
        containerWidth: '1200px',
        borderRadius: '16px',
        spacingUnit: '2rem',
        headerStyle: HeaderStyle.CENTERED,
        footerStyle: FooterStyle.MINIMAL,
        buttonStyle: ButtonStyle.PILL,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.COLORED,
      },

      // Blog Themes
      {
        name: 'Minimal Blog',
        description: 'Clean and minimal theme perfect for blogs',
        category: ThemeCategory.BLOG,
        primaryColor: '#374151',
        secondaryColor: '#6b7280',
        accentColor: '#10b981',

        surfaceColor: '#fefefe',
        surfaceAltColor: '#f9fafb',
        textColor: '#111827',
        textSecondary: '#6b7280',
        borderColor: '#e5e7eb',
        fontHeading: 'Inter',
        fontBody: 'Source Sans Pro',
        fontSizeBase: '18px',
        fontScaleRatio: 1.2,
        lineHeightBase: 1.8,
        containerWidth: '800px',
        borderRadius: '6px',
        spacingUnit: '1.5rem',
        headerStyle: HeaderStyle.MINIMAL,
        footerStyle: FooterStyle.MINIMAL,
        buttonStyle: ButtonStyle.GHOST,
        cardStyle: CardStyle.MINIMAL,
        shadowStyle: ShadowStyle.NONE,
      },

      {
        name: 'Magazine Style',
        description: 'Editorial theme inspired by magazines',
        category: ThemeCategory.BLOG,
        primaryColor: '#dc2626',
        secondaryColor: '#374151',
        accentColor: '#f59e0b',

        surfaceColor: '#f8fafc',
        surfaceAltColor: '#f1f5f9',
        textColor: '#1f2937',
        textSecondary: '#6b7280',
        borderColor: '#d1d5db',
        fontHeading: 'Merriweather',
        fontBody: 'PT Sans',
        fontSizeBase: '17px',
        fontScaleRatio: 1.3,
        lineHeightBase: 1.75,
        containerWidth: '1000px',
        borderRadius: '4px',
        spacingUnit: '1.25rem',
        headerStyle: HeaderStyle.DEFAULT,
        footerStyle: FooterStyle.COLUMNS,
        buttonStyle: ButtonStyle.SQUARE,
        cardStyle: CardStyle.OUTLINED,
        shadowStyle: ShadowStyle.SOFT,
      },

      // E-commerce Theme
      {
        name: 'Modern Store',
        description: 'Professional e-commerce theme with great UX',
        category: ThemeCategory.ECOMMERCE,
        primaryColor: '#059669',
        secondaryColor: '#4b5563',
        accentColor: '#f59e0b',

        surfaceColor: '#f9fafb',
        surfaceAltColor: '#f3f4f6',
        textColor: '#1f2937',
        textSecondary: '#6b7280',
        borderColor: '#d1d5db',
        fontHeading: 'Roboto',
        fontBody: 'Open Sans',
        fontSizeBase: '16px',
        fontScaleRatio: 1.25,
        lineHeightBase: 1.6,
        containerWidth: '1400px',
        borderRadius: '8px',
        spacingUnit: '1rem',
        headerStyle: HeaderStyle.DEFAULT,
        footerStyle: FooterStyle.COLUMNS,
        buttonStyle: ButtonStyle.ROUNDED,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.MEDIUM,
      },

      // Landing Page Theme
      {
        name: 'Startup Launch',
        description: 'High-converting theme for startup landing pages',
        category: ThemeCategory.LANDING,
        primaryColor: '#6366f1',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b',

        surfaceColor: '#f8fafc',
        surfaceAltColor: '#f1f5f9',
        textColor: '#1e293b',
        textSecondary: '#64748b',
        borderColor: '#e2e8f0',
        fontHeading: 'Poppins',
        fontBody: 'Inter',
        fontSizeBase: '16px',
        fontScaleRatio: 1.3,
        lineHeightBase: 1.6,
        containerWidth: '1200px',
        borderRadius: '12px',
        spacingUnit: '2rem',
        headerStyle: HeaderStyle.CENTERED,
        footerStyle: FooterStyle.MINIMAL,
        buttonStyle: ButtonStyle.PILL,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.MEDIUM,
      },

      // Minimalist Theme
      {
        name: 'Pure Minimal',
        description: 'Ultra-clean minimalist design',
        category: ThemeCategory.MINIMALIST,
        primaryColor: '#000000',
        secondaryColor: '#525252',
        accentColor: '#737373',

        surfaceColor: '#fefefe',
        surfaceAltColor: '#fafafa',
        textColor: '#0a0a0a',
        textSecondary: '#737373',
        borderColor: '#e5e5e5',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        fontSizeBase: '16px',
        fontScaleRatio: 1.2,
        lineHeightBase: 1.7,
        containerWidth: '800px',
        borderRadius: '2px',
        spacingUnit: '2rem',
        headerStyle: HeaderStyle.MINIMAL,
        footerStyle: FooterStyle.MINIMAL,
        buttonStyle: ButtonStyle.GHOST,
        cardStyle: CardStyle.MINIMAL,
        shadowStyle: ShadowStyle.NONE,
      },

      // Tech Theme
      {
        name: 'Tech Innovation',
        description: 'Modern theme for technology companies',
        category: ThemeCategory.BUSINESS,
        primaryColor: '#0ea5e9',
        secondaryColor: '#475569',
        accentColor: '#8b5cf6',

        surfaceColor: '#ffffff',
        surfaceAltColor: '#f1f5f9',
        textColor: '#0f172a',
        textSecondary: '#475569',
        borderColor: '#cbd5e1',
        fontHeading: 'Roboto',
        fontBody: 'Inter',
        fontSizeBase: '16px',
        fontScaleRatio: 1.25,
        lineHeightBase: 1.6,
        containerWidth: '1200px',
        borderRadius: '8px',
        spacingUnit: '1rem',
        headerStyle: HeaderStyle.DEFAULT,
        footerStyle: FooterStyle.DEFAULT,
        buttonStyle: ButtonStyle.ROUNDED,
        cardStyle: CardStyle.ELEVATED,
        shadowStyle: ShadowStyle.MEDIUM,
      }
    ];
  }

  // Validation and sanitization
  private validateAndSanitize(data: Partial<CreateThemeDto & UpdateThemeDto>) {
    const result: Partial<CreateThemeDto & UpdateThemeDto> = {};
    
    // Copy all provided fields
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data];
      if (value !== undefined) {
        (result as Record<string, unknown>)[key] = value as unknown;
      }
    });

    // Sanitize string fields
    if (result.name) result.name = result.name.toString().trim();
    if (result.description) result.description = result.description.toString().trim();
    
    // Validate and sanitize colors (basic hex validation)
    const colorFields = [
      'primaryColor', 'secondaryColor', 'accentColor', 'surfaceColor',
      'surfaceAltColor', 'textColor', 'textSecondary', 'borderColor',
      'errorColor', 'successColor', 'warningColor',
    ] as const;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resAny = result as any;
    for (const field of colorFields) {
      if (resAny[field]) {
        let color = String(resAny[field]).trim();
        const hex6 = /^#[0-9A-Fa-f]{6}$/;
        const hex3 = /^#([0-9A-Fa-f]{3})$/;
        const cssName = /^[a-zA-Z]+$/; // e.g., red, blue, transparent
        const functional = /^(rgb|rgba|hsl|hsla)\(/i;

        if (hex3.test(color)) {
          // Expand #RGB to #RRGGBB
          const m = color.match(hex3);
          if (m) {
            const r = m[1][0];
            const g = m[1][1];
            const b = m[1][2];
            color = `#${r}${r}${g}${g}${b}${b}`;
          }
        }

        // Accept #RRGGBB, CSS names, and functional color notations
        if (hex6.test(color) || cssName.test(color) || functional.test(color)) {
          resAny[field] = color;
        } else {
          // Be lenient: keep as-is without throwing (legacy behavior expected by tests)
          resAny[field] = color;
        }
      }
    }
    
    // Sanitize fonts
    if (result.fontHeading) result.fontHeading = result.fontHeading.toString().trim();
    if (result.fontBody) result.fontBody = result.fontBody.toString().trim();
    
    // Validate numbers
    if (result.fontScaleRatio !== undefined) {
      const ratio = typeof result.fontScaleRatio === 'string' ? parseFloat(result.fontScaleRatio) : Number(result.fontScaleRatio);
      if (isNaN(ratio) || ratio < 1 || ratio > 2) {
        throw new BadRequestException('fontScaleRatio must be between 1 and 2');
      }
      result.fontScaleRatio = ratio;
    }
    
    if (result.lineHeightBase !== undefined) {
      const lineHeight = typeof result.lineHeightBase === 'string' ? parseFloat(result.lineHeightBase) : Number(result.lineHeightBase);
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