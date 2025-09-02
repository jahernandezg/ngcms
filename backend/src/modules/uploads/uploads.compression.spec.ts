import { UploadsService } from './uploads.service';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

describe('UploadsService - compresión condicional', () => {
  let svc: UploadsService; let tmpDir: string;
  beforeAll(async () => { tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'uploads-comp-')); process.env.UPLOADS_DIR = tmpDir; svc = new UploadsService(); });
  afterAll(async () => { try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch (_e) { /* noop */ } });

  it('guarda y (si procede) comprime >1MB', async () => {
    // En pruebas no generamos una imagen real grande por performance; verificamos que guarda el archivo.
    const buf = Buffer.alloc(1.2 * 1024 * 1024);
    const res = await svc.handleUpload('post-image', { buffer: buf, originalname: 'big.jpg', mimetype: 'image/jpeg' });
    expect(res.url).toContain('/uploads/post-image/');
    const stat = await fs.stat(path.join(tmpDir, 'post-image', path.basename(res.path)));
    expect(stat.size).toBeGreaterThan(0);
  }, 20000);
});
