import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:3000';

describe('Auth Refresh E2E', () => {
  let accessToken: string; let refreshToken: string; let newAccessToken: string;

  it('login admin and obtain tokens', async () => {
    const res = await axios.post('/api/admin/auth/login', { email: 'admin@example.com', password: 'admin123' });
    expect([200,201]).toContain(res.status);
    const payload = res.data.data || res.data;
    accessToken = payload.accessToken;
    refreshToken = payload.refreshToken;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  it('refresh token returns a valid access token (puede o no diferir)', async () => {
    const res = await axios.post('/api/admin/auth/refresh', { refreshToken });
    expect([200,201]).toContain(res.status);
    const payload = res.data.data || res.data;
    newAccessToken = payload.accessToken;
    expect(newAccessToken).toBeTruthy();
    // Nota: En algunos entornos muy rápidos puede coincidir si payload y secret generan mismo iat/exp (ms). Aceptamos igualdad.
  });

  it('new access token works to list posts', async () => {
    const res = await axios.get('/api/admin/posts', { headers: { Authorization: `Bearer ${newAccessToken}` } });
    expect(res.status).toBe(200);
    const list = res.data.data || res.data;
    expect(Array.isArray(list)).toBe(true);
  });
});
