import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:3000';

describe('Auth 401 invalid token', () => {
  it('rechaza token inválido', async () => {
    const res = await axios.get('/api/admin/posts', { headers: { Authorization: 'Bearer invalid.token.value' }, validateStatus: () => true });
    expect(res.status).toBe(401);
  });

  it('rechaza ausencia de token', async () => {
    const res = await axios.get('/api/admin/posts', { validateStatus: () => true });
    expect(res.status).toBe(401);
  });
});
