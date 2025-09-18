import axios from 'axios';

/**
 * E2E: Verifica que /api/resolve incluye featuredImage cuando el path resuelve a un post.
 */

describe('GET /api/resolve?path=... (featuredImage)', () => {
  const slug = process.env.E2E_POST_WITH_IMAGE_SLUG || 'e2e-post-mf7nbahq';
  const path = `blog/${slug}`; // ajustar si la estructura cambia

  it('incluye featuredImage en payload cuando type=post', async () => {
    const res = await axios.get(`/api/resolve`, { params: { path } });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('data.type', 'post');
    expect(res.data).toHaveProperty('data.payload');
    const payload = res.data.data.payload;
    expect(payload).toHaveProperty('featuredImage');
    const fi = payload.featuredImage;
    expect(fi === null || typeof fi === 'string').toBe(true);
    if (fi) {
      expect(/^(https?:\/\/|\/uploads\/)/.test(fi)).toBe(true);
    }
  });
});
