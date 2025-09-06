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

  it('rechaza MIME no permitido', async () => {
    const buf = Buffer.from('not-an-image');
  const badFile = { buffer: buf, originalname: 'x.txt', mimetype: 'text/plain' } as unknown as { buffer: Buffer; originalname: string; mimetype: string };
  await expect(svc.handleUpload('post-image', badFile)).rejects.toThrow('MIME no permitido');
  });

  it('rechaza archivo demasiado grande', async () => {
    const bigBuf = Buffer.alloc(4 * 1024 * 1024); // 4MB para post-image (límite 3MB)
    await expect(
      svc.handleUpload('post-image', { buffer: bigBuf, originalname: 'big.jpg', mimetype: 'image/jpeg' })
    ).rejects.toThrow('Archivo demasiado grande');
  });

  it('permite SVG para logo-light y guarda tal cual', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"></svg>');
    const res = await svc.handleUpload('logo-light', { buffer: svg, originalname: 'logo.svg', mimetype: 'image/svg+xml' });
    expect(res.url).toContain('/uploads/logo-light/');
    const stat = await fs.stat(path.join(tmpDir, 'logo-light', path.basename(res.path)));
    expect(stat.size).toBeGreaterThan(0);
  });

  it('permite ICO para favicon y guarda tal cual', async () => {
    // ICO mínimo inválido en contenido, pero la ruta ICO no usa sharp, sólo escribe
    const ico = Buffer.from('00000100');
    const res = await svc.handleUpload('favicon', { buffer: ico, originalname: 'favicon.ico', mimetype: 'image/x-icon' });
    expect(res.url).toContain('/uploads/favicon/');
  });

  it('guarda sin procesar si buffer jpeg inválido (no favicon)', async () => {
    const junk = Buffer.from('JUNK');
    const res = await svc.handleUpload('post-image', { buffer: junk, originalname: 'junk.jpg', mimetype: 'image/jpeg' });
    expect(res.url).toContain('/uploads/post-image/');
  });
});
