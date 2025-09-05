import { unwrapData, getIdFromResponse } from './http-utils';

describe('http-utils', () => {
  describe('unwrapData', () => {
    it('devuelve data cuando viene envuelto', () => {
      const res = unwrapData<{ foo: number }>({ data: { foo: 1 } });
      expect(res).toEqual({ foo: 1 });
    });

    it('retorna el valor original cuando no hay envoltorio', () => {
      const res = unwrapData<number>(5 as unknown as { data: number } | number);
      expect(res).toBe(5);
    });
  });

  describe('getIdFromResponse', () => {
    it('extrae id desde data si existe', () => {
      const id = getIdFromResponse({ data: { id: 'abc123' } });
      expect(id).toBe('abc123');
    });

    it('extrae id del objeto raíz si no está en data', () => {
      const id = getIdFromResponse({ id: 'root-id' });
      expect(id).toBe('root-id');
    });

    it('retorna undefined si no hay id', () => {
      const id = getIdFromResponse({ data: { notId: 'x' } });
      expect(id).toBeUndefined();
    });

    it('retorna undefined con entradas no objeto', () => {
      expect(getIdFromResponse(null)).toBeUndefined();
      expect(getIdFromResponse(undefined)).toBeUndefined();
      expect(getIdFromResponse('str' as unknown)).toBeUndefined();
    });
  });
});
