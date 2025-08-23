import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, MinLength, MaxLength } from 'class-validator';
// Import theme enums from local definitions
import { 
  ThemeCategory, 
  HeaderStyle, 
  FooterStyle, 
  ButtonStyle, 
  CardStyle, 
  ShadowStyle 
} from '../enums/theme.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThemeDto {
  @ApiProperty({ description: 'Nombre del theme' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del theme' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: ThemeCategory, description: 'Categoría del theme' })
  @IsOptional()
  @IsEnum(ThemeCategory)
  category?: ThemeCategory;

  // Colors
  @ApiPropertyOptional({ description: 'Color primario (hex)', default: '#2563eb' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Color secundario (hex)', default: '#64748b' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Color de acento (hex)', default: '#f59e0b' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional({ description: 'Color de superficie (hex)', default: '#ffffff' })
  @IsOptional()
  @IsString()
  surfaceColor?: string;

  @ApiPropertyOptional({ description: 'Color de superficie alternativo (hex)', default: '#f8fafc' })
  @IsOptional()
  @IsString()
  surfaceAltColor?: string;

  @ApiPropertyOptional({ description: 'Color de texto (hex)', default: '#1e293b' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ description: 'Color de texto secundario (hex)', default: '#64748b' })
  @IsOptional()
  @IsString()
  textSecondary?: string;

  @ApiPropertyOptional({ description: 'Color de borde (hex)', default: '#e2e8f0' })
  @IsOptional()
  @IsString()
  borderColor?: string;

  // Typography
  @ApiPropertyOptional({ description: 'Fuente para títulos', default: 'Inter' })
  @IsOptional()
  @IsString()
  fontHeading?: string;

  @ApiPropertyOptional({ description: 'Fuente para texto', default: 'Inter' })
  @IsOptional()
  @IsString()
  fontBody?: string;

  @ApiPropertyOptional({ description: 'Tamaño base de fuente', default: '16px' })
  @IsOptional()
  @IsString()
  fontSizeBase?: string;

  @ApiPropertyOptional({ description: 'Ratio de escala tipográfica', default: 1.25 })
  @IsOptional()
  @IsNumber()
  fontScaleRatio?: number;

  @ApiPropertyOptional({ description: 'Altura de línea base', default: 1.6 })
  @IsOptional()
  @IsNumber()
  lineHeightBase?: number;

  // Layout
  @ApiPropertyOptional({ description: 'Ancho máximo del container', default: '1200px' })
  @IsOptional()
  @IsString()
  containerWidth?: string;

  @ApiPropertyOptional({ description: 'Unidad de espaciado base', default: '1rem' })
  @IsOptional()
  @IsString()
  spacingUnit?: string;

  @ApiPropertyOptional({ description: 'Radio de borde base', default: '8px' })
  @IsOptional()
  @IsString()
  borderRadius?: string;

  @ApiPropertyOptional({ enum: HeaderStyle, description: 'Estilo del header' })
  @IsOptional()
  @IsEnum(HeaderStyle)
  headerStyle?: HeaderStyle;

  @ApiPropertyOptional({ enum: FooterStyle, description: 'Estilo del footer' })
  @IsOptional()
  @IsEnum(FooterStyle)
  footerStyle?: FooterStyle;

  // Components
  @ApiPropertyOptional({ enum: ButtonStyle, description: 'Estilo de botones' })
  @IsOptional()
  @IsEnum(ButtonStyle)
  buttonStyle?: ButtonStyle;

  @ApiPropertyOptional({ enum: CardStyle, description: 'Estilo de cards' })
  @IsOptional()
  @IsEnum(CardStyle)
  cardStyle?: CardStyle;

  @ApiPropertyOptional({ enum: ShadowStyle, description: 'Estilo de sombras' })
  @IsOptional()
  @IsEnum(ShadowStyle)
  shadowStyle?: ShadowStyle;

  @ApiPropertyOptional({ description: 'Velocidad de animaciones', default: '300ms' })
  @IsOptional()
  @IsString()
  animationSpeed?: string;

  @ApiPropertyOptional({ description: 'CSS personalizado' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  customCss?: string;

  @ApiPropertyOptional({ description: 'URL de imagen de preview' })
  @IsOptional()
  @IsString()
  previewImage?: string;
}

export class UpdateThemeDto extends CreateThemeDto {
  @ApiPropertyOptional({ description: 'Si el theme debe activarse inmediatamente' })
  @IsOptional()
  @IsBoolean()
  setActive?: boolean;
}

export class ThemeVariablesDto {
  @ApiPropertyOptional({ description: 'Variables CSS adicionales como objeto JSON' })
  @IsOptional()
  settings?: Record<string, unknown>;
}