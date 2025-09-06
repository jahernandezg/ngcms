import { BadRequestException, Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

type MulterFile = { buffer: Buffer; originalname: string; mimetype: string; size?: number };
type UploadType = 'logo-light' | 'logo-dark' | 'favicon' | 'og-image' | 'post-image';

const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const FAVICON_MAX_SIZE = 1 * 1024 * 1024; // 1MB
const POST_IMAGE_MAX_SIZE = 3 * 1024 * 1024; // 3MB
const _FAVICON_SIZES = [16, 32, 48];

const _ALLOWED: Record<UploadType, string[]> = {
  'logo-light': ['image/png', 'image/jpeg', 'image/svg+xml'],
  'logo-dark': ['image/png', 'image/jpeg', 'image/svg+xml'],
  'favicon': ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml'],
  'og-image': ['image/png', 'image/jpeg', 'image/webp'],
  'post-image': ['image/png', 'image/jpeg', 'image/webp'],
};

const _MAX_SIZE: Record<UploadType, number> = {
  'logo-light': LOGO_MAX_SIZE,
  'logo-dark': LOGO_MAX_SIZE,
  'favicon': FAVICON_MAX_SIZE,
  'og-image': POST_IMAGE_MAX_SIZE,
  'post-image': POST_IMAGE_MAX_SIZE,
};

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  // Usamos ExecutionContext a través de metadata.data si está disponible; en pipes puros, accedemos al request mediante una propiedad no tipada
  transform(value: MulterFile | undefined, _metadata: ArgumentMetadata): MulterFile {
    // metadata no nos da el request; accedemos vía (global as any).__req si lo hubiéramos inyectado; en su lugar, hacemos validación genérica
    // El tipo se obtiene del request params usando un hack común: el interceptor establece file.fieldname, pero no el tipo.
    // Mejor: dejamos que el controlador pase el tipo y que el servicio haga la validación final. Aquí sólo validamos que exista archivo.
    if (!value) throw new BadRequestException('Archivo requerido');
    // Nota: Validación específica por tipo se hará en UploadsService para disponer de params.type.
    return value;
  }
}
