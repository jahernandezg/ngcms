import axios from 'axios';

/**
 * E2E: Verifica que el endpoint detalle de post expone featuredImage
 * Precondición: Debe existir un post publicado con slug y featuredImage no nula.
 * Para entorno de CI se podría sembrar un post de prueba antes.
 */

describe('GET /api/posts/:slug (featuredImage)', () => {
  // Slug de ejemplo; ajustar si se usa otro en semilla e2e
  const slug = process.env.E2E_POST_WITH_IMAGE_SLUG || 'e2e-post-mf7nbahq';

  it('devuelve featuredImage en el detalle', async () => {
    const res = await axios.get(`/api/posts/${slug}`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('data.featuredImage');
    const fi = res.data.data.featuredImage;
    expect(fi === null || typeof fi === 'string').toBe(true);
    // Si hay valor, validar formato aceptado (http(s) o /uploads/...)
    if (fi) {
      expect(/^(https?:\/\/|\/uploads\/)/.test(fi)).toBe(true);
    }
  });
});
