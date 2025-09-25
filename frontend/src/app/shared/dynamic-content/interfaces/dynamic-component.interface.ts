export interface DynamicComponent {
  // Método opcional para recibir parámetros ya validados
  setParams?(params: Record<string, unknown>): void;
}
