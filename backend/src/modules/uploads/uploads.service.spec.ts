import { UploadsService } from './uploads.service';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

// Helper para crear un PNG cuadrado del tamaño indicado usando import dinámico
async function makePng(size: number): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import('sharp');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharpLib: any = mod.default || mod;
  const img = sharpLib({ create: { width: size, height: size, channels: 3, background: { r: 255, g: 0, b: 0 } } });
  return img.png().toBuffer();
}

describe('UploadsService - favicon PNG sizes', () => {
  let svc: UploadsService;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'uploads-test-'));
    process.env.UPLOADS_DIR = tmpDir;
    svc = new UploadsService();
  });

  afterAll(async () => {
    // Limpieza del directorio temporal
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch (_e) { /* noop */ }
  });

  it('acepta 16x16, 32x32, 48x48', async () => {
    const sizes = [16, 32, 48];
    for (const s of sizes) {
      const buffer = await makePng(s);
      const res = await svc.handleUpload('favicon', { buffer, originalname: `f${s}.png`, mimetype: 'image/png' });
      expect(res.url).toContain('/uploads/favicon/');
    }
  }, 20000);

  it('rechaza tamaños no válidos (e.g., 20x20)', async () => {
    const buffer = await makePng(20);
    await expect(
      svc.handleUpload('favicon', { buffer, originalname: 'f20.png', mimetype: 'image/png' })
    ).rejects.toThrow('Favicon PNG debe ser 16x16, 32x32 o 48x48');
  }, 20000);
});
