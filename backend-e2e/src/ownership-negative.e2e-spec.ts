import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:3000';

// Caso negativo: Autor intentando actualizar un post creado por ADMIN => 403

describe('Ownership negativo', () => {
  let adminToken: string; let authorToken: string; let postId: string;

  it('admin crea post', async () => {
    const loginAdmin = await axios.post('/api/admin/auth/login', { email: 'admin@example.com', password: 'admin123' });
    const adminPayload = loginAdmin.data.data || loginAdmin.data;    
    adminToken = adminPayload.accessToken;
    expect(adminToken).toBeTruthy();
  const create = await axios.post('/api/admin/posts', { title: 'Post Admin Forbid', content: '<p>contenido valido para dto</p>', status: 'DRAFT' }, { headers: { Authorization: `Bearer ${adminToken}` }, validateStatus: () => true });
  expect([200,201]).toContain(create.status);
    const body = create.data.data || create.data;
    postId = body.id;
    expect(postId).toBeTruthy();
  });

  it('autor intenta actualizar y recibe 403', async () => {
    const loginAuthor = await axios.post('/api/admin/auth/login', { email: 'author@example.com', password: 'author123' });
    const authorPayload = loginAuthor.data.data || loginAuthor.data;
    authorToken = authorPayload.accessToken;
    expect(authorToken).toBeTruthy();

  const attempt = await axios.put(`/api/admin/posts/${postId}`, { status: 'PUBLISHED' }, { headers: { Authorization: `Bearer ${authorToken}` }, validateStatus: () => true });
  // Puede ser 403 (Forbidden) o 404 si por algún motivo se oculta existencia; asumimos 403 explícito.
  expect(attempt.status).toBe(403);
  });
});
