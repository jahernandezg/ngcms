import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
type MulterFile = { buffer: Buffer; originalname: string; mimetype: string };

export type UploadType = 'logo-light' | 'logo-dark' | 'favicon' | 'og-image' | 'post-image';

const ACCEPTED: Record<UploadType, { mime: string[]; maxW: number; maxH: number }> = {
  // Logos: PNG, JPEG y SVG
  'logo-light': { mime: ['image/png', 'image/jpeg', 'image/svg+xml'], maxW: 1024, maxH: 512 },
  'logo-dark': { mime: ['image/png', 'image/jpeg', 'image/svg+xml'], maxW: 1024, maxH: 512 },
  // Favicon: sólo ICO o PNG (sin SVG) según especificación
  'favicon': { mime: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'], maxW: 512, maxH: 512 },
  'og-image': { mime: ['image/png', 'image/jpeg', 'image/webp'], maxW: 1600, maxH: 900 },
  'post-image': { mime: ['image/png', 'image/jpeg', 'image/webp'], maxW: 2400, maxH: 1600 },
};

const MAX_SIZE: Record<UploadType, number> = {
  'logo-light': 2 * 1024 * 1024, // 2MB
  'logo-dark': 2 * 1024 * 1024, // 2MB
  'favicon': 1 * 1024 * 1024, // 1MB
  'og-image': 3 * 1024 * 1024, // 3MB
  'post-image': 3 * 1024 * 1024, // 3MB
};

const FAVICON_PNG_ALLOWED_SIZES = [16, 32, 48];

@Injectable()
export class UploadsService {
  private baseDir: string;
  constructor() {
    const cwd = process.cwd();
    this.baseDir = process.env.UPLOADS_DIR || path.join(cwd, 'uploads');
  }

  private ensureTypeDir(type: UploadType) {
    const dir = path.join(this.baseDir, type);
    return fs.mkdir(dir, { recursive: true }).then(() => dir);
  }

  async handleUpload(type: UploadType, file: MulterFile) {
    const rule = ACCEPTED[type];
    if (!rule) throw new BadRequestException('Tipo no soportado');
    if (!file) throw new BadRequestException('Archivo requerido');
    const maxBytes = MAX_SIZE[type];
    const sizeBytes = (file as unknown as { size?: number }).size ?? file.buffer?.length ?? 0;
    if (maxBytes && sizeBytes > maxBytes) {
      throw new BadRequestException(`Archivo demasiado grande. Máximo ${Math.round(maxBytes / (1024 * 1024))}MB para ${type}`);
    }
    if (!rule.mime.includes(file.mimetype)) {
      throw new BadRequestException(`MIME no permitido: ${file.mimetype}`);
    }

    const dir = await this.ensureTypeDir(type);
    const ext = this.pickExt(file.mimetype, file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const full = path.join(dir, name);

    // SVG u ICO: validaciones básicas y guardar tal cual
    if (/(svg\+xml|x-icon|vnd\.microsoft\.icon)/.test(file.mimetype)) {
      // Si es favicon y viene SVG, no está permitido según reglas
      if (type === 'favicon' && /svg\+xml/.test(file.mimetype)) {
        throw new BadRequestException('Favicon SVG no permitido. Usa PNG (16/32/48) o ICO');
      }
      // Para favicon PNG aplicamos validación de tamaños exactos; para ICO/SVG lo permitimos tal cual
      await fs.writeFile(full, new Uint8Array(file.buffer));
    } else {
      // Raster: limitar dimensiones y comprimir
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharpMod: any = await import('sharp');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharp: any = sharpMod.default || sharpMod;
  const img = sharp(file.buffer, { failOn: 'warning' });
      const meta = await img.metadata();
      const width = meta.width || rule.maxW;
      const height = meta.height || rule.maxH;
      const fitW = Math.min(width, rule.maxW);
      const fitH = Math.min(height, rule.maxH);
      // Validación específica: favicon PNG debe ser cuadrado y de 16/32/48
      if (type === 'favicon' && file.mimetype === 'image/png') {
        if (!width || !height || width !== height || !FAVICON_PNG_ALLOWED_SIZES.includes(width)) {
          throw new BadRequestException('Favicon PNG debe ser 16x16, 32x32 o 48x48 píxeles');
        }
      }

      let pipeline = img.resize(fitW, fitH, { fit: 'inside', withoutEnlargement: true });
      const big = sizeBytes > 1 * 1024 * 1024; // >1MB
      if (file.mimetype === 'image/png') {
        pipeline = pipeline.png({ compressionLevel: big ? 9 : 6, adaptiveFiltering: true, palette: big });
      } else if (file.mimetype === 'image/jpeg') {
        pipeline = pipeline.jpeg({ quality: big ? 80 : 85, mozjpeg: true, progressive: true });
      } else {
        pipeline = pipeline.webp({ quality: big ? 80 : 85 });
      }
      await pipeline.toFile(full);
    }

    const publicUrl = `/uploads/${type}/${name}`;
    return { url: publicUrl, path: full };
  }

  async deleteFile(type: UploadType, filename: string) {
    const rule = ACCEPTED[type];
    if (!rule) throw new BadRequestException('Tipo no soportado');
    if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
      throw new BadRequestException('Nombre de archivo inválido');
    }
    const filePath = path.join(this.baseDir, type, filename);
    // Asegurar que el path esté bajo baseDir
    const rel = path.relative(path.join(this.baseDir, type), filePath);
    if (rel.startsWith('..')) throw new BadRequestException('Ruta fuera de directorio permitido');
    try {
      await fs.stat(filePath);
    } catch {
      throw new NotFoundException('Archivo no encontrado');
    }
    await fs.unlink(filePath);
    return { deleted: true };
  }

  private pickExt(mime: string, original: string) {
    const map: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/x-icon': '.ico',
      'image/vnd.microsoft.icon': '.ico',
    };
    return map[mime] || path.extname(original) || '';
  }
}
