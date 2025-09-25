import { Injectable } from '@angular/core';
import { ComponentConfig } from '../interfaces/component-config.interface';

@Injectable({ providedIn: 'root' })
export class ComponentValidatorService {
  validateParams(config: ComponentConfig, params: Record<string, unknown> | undefined): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
    const result: Record<string, unknown> = {};
    const p = params || {};
    for (const input of config.inputs) {
      const raw = p[input.name];
      if (raw == null) {
        if (input.required && input.defaultValue == null) {
          return { ok: false, error: `Falta parámetro requerido: ${input.name}` };
        }
        if (input.defaultValue != null) {
          result[input.name] = input.defaultValue;
        }
        continue;
      }
      let value: unknown = raw;
      switch (input.type) {
        case 'number':
          value = typeof raw === 'number' ? raw : Number(raw);
          if (Number.isNaN(value)) return { ok: false, error: `Parámetro ${input.name} debe ser numérico` };
          break;
        case 'boolean':
          value = typeof raw === 'boolean' ? raw : String(raw).toLowerCase() === 'true';
          break;
        case 'select':
        case 'multiselect':
          if (input.options && input.options.length) {
            const allowed = new Set(input.options.map(o => o.value));
            if (input.type === 'multiselect') {
              const arr = Array.isArray(raw) ? raw : String(raw).split(',').map(s => s.trim());
              const invalid = arr.filter(v => !allowed.has(v));
              if (invalid.length) return { ok: false, error: `Valores no válidos en ${input.name}: ${invalid.join(', ')}` };
              value = arr;
            } else {
              if (!allowed.has(raw)) return { ok: false, error: `Valor no válido en ${input.name}` };
            }
          }
          break;
        case 'string':
        default:
          value = String(raw);
      }
      if (input.validation && typeof value === 'string' && !input.validation.test(value)) {
        return { ok: false, error: `Formato no válido para ${input.name}` };
      }
      result[input.name] = value;
    }
    return { ok: true, value: result };
  }
}
