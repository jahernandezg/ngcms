export type ApiEnvelope<T> = { success?: boolean; message?: string; data: T } | T;

export function unwrapData<T>(resp: ApiEnvelope<T>): T {
  if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
    return (resp as { data: T }).data;
  }
  return resp as T;
}

export function getIdFromResponse(resp: unknown): string | undefined {
  if (!resp || typeof resp !== 'object') return undefined;
  const obj = resp as Record<string, unknown>;
  const fromData = obj['data'] as Record<string, unknown> | undefined;
  const idFromData = fromData && typeof fromData['id'] === 'string' ? (fromData['id'] as string) : undefined;
  if (idFromData) return idFromData;
  return typeof obj['id'] === 'string' ? (obj['id'] as string) : undefined;
}
