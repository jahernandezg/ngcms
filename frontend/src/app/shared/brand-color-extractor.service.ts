import { Injectable, signal } from '@angular/core';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  confidence: number; // 0-1, how confident we are in this palette
  dominantColors: string[];
}

export interface ExtractedBrand {
  logo?: File;
  logoUrl?: string;
  brandName: string;
  palette: ColorPalette;
  suggestedThemeName: string;
  extractedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BrandColorExtractorService {
  
  // Signal to track extraction progress
  isExtracting = signal(false);
  extractionProgress = signal(0);
  
  constructor() {}

  /**
   * Extract colors from uploaded logo image
   */
  async extractColorsFromLogo(file: File, brandName: string = ''): Promise<ExtractedBrand> {
    this.isExtracting.set(true);
    this.extractionProgress.set(0);

    try {
      // Create image element for processing
      const img = await this.loadImageFromFile(file);
      this.extractionProgress.set(25);
      
      // Extract dominant colors using canvas
      const dominantColors = await this.extractDominantColors(img);
      this.extractionProgress.set(50);
      
      // Generate cohesive palette from dominant colors
      const palette = this.generatePaletteFromColors(dominantColors);
      this.extractionProgress.set(75);
      
      // Generate suggested theme name
      const suggestedThemeName = this.generateThemeName(brandName, palette);
      this.extractionProgress.set(100);
      
      const extractedBrand: ExtractedBrand = {
        logo: file,
        brandName: brandName || 'Mi Marca',
        palette,
        suggestedThemeName,
        extractedAt: new Date()
      };
      
      return extractedBrand;
      
    } finally {
      this.isExtracting.set(false);
      this.extractionProgress.set(0);
    }
  }

  /**
   * Extract colors from logo URL
   */
  async extractColorsFromUrl(logoUrl: string, brandName: string = ''): Promise<ExtractedBrand> {
    this.isExtracting.set(true);
    this.extractionProgress.set(0);

    try {
      const img = await this.loadImageFromUrl(logoUrl);
      this.extractionProgress.set(25);
      
      const dominantColors = await this.extractDominantColors(img);
      this.extractionProgress.set(50);
      
      const palette = this.generatePaletteFromColors(dominantColors);
      this.extractionProgress.set(75);
      
      const suggestedThemeName = this.generateThemeName(brandName, palette);
      this.extractionProgress.set(100);
      
      return {
        logoUrl,
        brandName: brandName || 'Mi Marca',
        palette,
        suggestedThemeName,
        extractedAt: new Date()
      };
      
    } finally {
      this.isExtracting.set(false);
      this.extractionProgress.set(0);
    }
  }

  /**
   * Load image from file
   */
  private loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Load image from URL
   */
  private loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image from URL'));
      
      img.src = url;
    });
  }

  /**
   * Extract dominant colors from image using canvas
   */
  private async extractDominantColors(img: HTMLImageElement): Promise<string[]> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Resize image for performance (max 200px)
    const maxSize = 200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Count color frequencies
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const alpha = pixels[i + 3];
      
      // Skip transparent/white/near-white pixels
      if (alpha < 128 || (r > 240 && g > 240 && b > 240)) {
        continue;
      }
      
      // Group similar colors (reduce precision)
      const roundedR = Math.round(r / 15) * 15;
      const roundedG = Math.round(g / 15) * 15;
      const roundedB = Math.round(b / 15) * 15;
      
      const color = `rgb(${roundedR}, ${roundedG}, ${roundedB})`;
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }
    
    // Get top colors by frequency
    const sortedColors = Array.from(colorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([color]) => color);
    
    // Convert to hex format
    return sortedColors.map(rgb => this.rgbToHex(rgb));
  }

  /**
   * Generate cohesive palette from extracted colors
   */
  private generatePaletteFromColors(colors: string[]): ColorPalette {
    if (colors.length === 0) {
      return this.getDefaultPalette();
    }

    // Get primary color (most prominent)
    const primary = colors[0];
    
    // Find complementary/contrasting colors for secondary and accent
    const secondary = this.findBestSecondary(primary, colors);
    const accent = this.findBestAccent(primary, secondary, colors);
    
    // Generate neutral colors
    const background = '#ffffff';
    const surface = '#f8fafc';
    
    // Calculate confidence based on color variety and quality
    const confidence = this.calculatePaletteConfidence(colors);
    
    return {
      primary,
      secondary,
      accent,
      background,
      surface,
      confidence,
      dominantColors: colors
    };
  }

  /**
   * Find best secondary color
   */
  private findBestSecondary(primary: string, colors: string[]): string {
    if (colors.length < 2) {
      return this.adjustColorBrightness(primary, -30);
    }
    
    // Find color with good contrast to primary
    for (let i = 1; i < colors.length; i++) {
      const contrast = this.getColorContrast(primary, colors[i]);
      if (contrast > 2.5) {
        return colors[i];
      }
    }
    
    return colors[1] || this.adjustColorBrightness(primary, -30);
  }

  /**
   * Find best accent color
   */
  private findBestAccent(primary: string, secondary: string, colors: string[]): string {
    if (colors.length < 3) {
      return this.adjustColorSaturation(primary, 20);
    }
    
    // Find color different from primary and secondary
    for (let i = 2; i < colors.length; i++) {
      const color = colors[i];
      if (color !== primary && color !== secondary) {
        return color;
      }
    }
    
    return this.adjustColorSaturation(primary, 20);
  }

  /**
   * Calculate palette confidence score
   */
  private calculatePaletteConfidence(colors: string[]): number {
    if (colors.length < 2) return 0.3;
    if (colors.length < 4) return 0.6;
    if (colors.length < 6) return 0.8;
    return 0.9;
  }

  /**
   * Generate theme name suggestion
   */
  private generateThemeName(brandName: string, palette: ColorPalette): string {
    const colorName = this.getColorName(palette.primary);
    const adjective = this.getThemeAdjective(palette.confidence);
    
    if (brandName) {
      return `${brandName} ${colorName}`;
    }
    
    return `${adjective} ${colorName}`;
  }

  /**
   * Get color name from hex
   */
  private getColorName(hex: string): string {
    const hsl = this.hexToHsl(hex);
    const hue = hsl.h;
    
    if (hue < 15 || hue > 345) return 'Rojo';
    if (hue < 45) return 'Naranja';
    if (hue < 75) return 'Amarillo';
    if (hue < 105) return 'Lima';
    if (hue < 135) return 'Verde';
    if (hue < 165) return 'Turquesa';
    if (hue < 195) return 'Cian';
    if (hue < 225) return 'Azul';
    if (hue < 255) return 'Azul Oscuro';
    if (hue < 285) return 'Púrpura';
    if (hue < 315) return 'Magenta';
    return 'Rosa';
  }

  /**
   * Get theme adjective based on confidence
   */
  private getThemeAdjective(confidence: number): string {
    if (confidence > 0.8) return 'Vibrante';
    if (confidence > 0.6) return 'Elegante';
    if (confidence > 0.4) return 'Sutil';
    return 'Suave';
  }

  /**
   * Default palette fallback
   */
  private getDefaultPalette(): ColorPalette {
    return {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      confidence: 0.5,
      dominantColors: ['#3b82f6', '#64748b', '#f59e0b']
    };
  }

  // Utility methods for color manipulation
  private rgbToHex(rgb: string): string {
    const match = rgb.match(/\d+/g);
    if (!match) return '#000000';
    
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const delta = max - min;
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      
      switch (max) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private adjustColorBrightness(hex: string, amount: number): string {
    const hsl = this.hexToHsl(hex);
    hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
    return this.hslToHex(hsl.h, hsl.s, hsl.l);
  }

  private adjustColorSaturation(hex: string, amount: number): string {
    const hsl = this.hexToHsl(hex);
    hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
    return this.hslToHex(hsl.h, hsl.s, hsl.l);
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c/2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  private getColorContrast(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  private getLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
}