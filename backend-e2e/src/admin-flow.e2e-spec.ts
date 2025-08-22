import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:3000';

describe('Admin E2E flujo crítico', () => {
  let accessToken: string; let createdId: string;
  it('login admin', async () => {
    const res = await axios.post('/api/admin/auth/login', { email: 'admin@example.com', password: 'admin123' });
    expect([200,201]).toContain(res.status);
    // Interceptor envuelve en { success, message, data }
    accessToken = (res.data?.data?.accessToken) || res.data.accessToken;
    expect(accessToken).toBeTruthy();
  });
  it('create draft post', async () => {
  const res = await axios.post('/api/admin/posts', { title: 'E2E Post', content: '<p>Contenido</p>', status: 'DRAFT' }, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect([200,201]).toContain(res.status);
  createdId = (res.data.data?.id) || res.data.id;
  });
  it('publish post', async () => {
  const res = await axios.put(`/api/admin/posts/${createdId}`, { status: 'PUBLISHED' }, { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(res.status).toBe(200);
  const body = res.data.data || res.data;
  expect(body.status).toBe('PUBLISHED');
  });
  it('list posts includes created', async () => {
  const res = await axios.get('/api/admin/posts', { headers: { Authorization: `Bearer ${accessToken}` } });
  expect(res.status).toBe(200);
  interface Post { id: string }
  const list: Post[] = res.data.data || res.data;
  const found = list.find(p => p.id === createdId);
  expect(found).toBeTruthy();
  });
});
