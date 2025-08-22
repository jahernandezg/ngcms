export function sharedTypes(): string {
  return 'shared-types';
}

// Tipos genéricos del wrapper estándar
export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  path?: string;
  timestamp?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Re-export parcial de tipos OpenAPI generados para consumo externo
export * from './openapi-types';
