import { JwtStrategy } from './jwt.strategy';
import { ExtractJwt } from 'passport-jwt';

describe('JwtStrategy', () => {
  it('validate retorna payload simplificado', async () => {
    const strat = new JwtStrategy();
    const result = await strat.validate({ sub: 'u1', email: 'a@b.com', roles: ['ADMIN'] });
    expect(result).toEqual({ sub: 'u1', email: 'a@b.com', roles: ['ADMIN'] });
  });
  it('config define extractor de bearer token', () => {
    const extractorFactory = ExtractJwt.fromAuthHeaderAsBearerToken();
  const fakeReq: { headers: { authorization: string } } = { headers: { authorization: 'Bearer XYZ' } };
    expect(extractorFactory(fakeReq)).toBe('XYZ');
  });
});
