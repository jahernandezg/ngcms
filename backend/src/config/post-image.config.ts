// Configuración específica para imágenes principales de posts
export const POST_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const POST_IMAGE_COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // 2MB
export const POST_IMAGE_QUALITY = 85; // Calidad para JPEG/WebP
export const POST_IMAGE_MAX_WIDTH = 1920;
export const POST_IMAGE_MAX_HEIGHT = 1080;
export const REQUIRED_ASPECT_RATIO = 16 / 9; // 1.777...
export const ASPECT_RATIO_TOLERANCE = 0.02; // ±2%
export const POST_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type PostImageAcceptedMime = typeof POST_IMAGE_FORMATS[number];

export function isValidAspectRatio(width: number, height: number) {
  if (!width || !height) return false;
  const ratio = width / height;
  const min = REQUIRED_ASPECT_RATIO * (1 - ASPECT_RATIO_TOLERANCE);
  const max = REQUIRED_ASPECT_RATIO * (1 + ASPECT_RATIO_TOLERANCE);
  return ratio >= min && ratio <= max;
}
