import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { ASPECT_RATIO_TOLERANCE, REQUIRED_ASPECT_RATIO } from '../../../config/post-image.config';

// Definimos un tipo mínimo para MulterFile que usamos
interface MulterFile { buffer: Buffer; originalname: string; mimetype: string }

@Injectable()
export class AspectRatioValidationPipe implements PipeTransform {
  async transform(file: MulterFile) {
    if (!file) throw new BadRequestException('Archivo requerido');
    // Sólo validar imágenes raster comunes
    if (!/(png|jpeg|webp)/.test(file.mimetype)) return file;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sharpMod: any = await import('sharp');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sharp: any = sharpMod.default || sharpMod;
      const img = sharp(file.buffer, { failOn: 'truncated' });
      const meta = await img.metadata();
      const w = meta.width || 0;
      const h = meta.height || 0;
      if (!w || !h) throw new BadRequestException('No se pudo leer dimensiones de la imagen');
      const ratio = w / h;
      const min = REQUIRED_ASPECT_RATIO * (1 - ASPECT_RATIO_TOLERANCE);
      const max = REQUIRED_ASPECT_RATIO * (1 + ASPECT_RATIO_TOLERANCE);
      if (ratio < min || ratio > max) {
        throw new BadRequestException(`Aspect ratio inválido. Se requiere 16:9 (tolerancia ±${ASPECT_RATIO_TOLERANCE * 100}%). Actual: ${(ratio).toFixed(3)}`);
      }
      return file;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Error validando aspect ratio');
    }
  }
}
