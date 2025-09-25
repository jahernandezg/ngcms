import { Type } from '@angular/core';

export type ComponentCategory = 'content' | 'widget' | 'form' | 'media';

export interface ComponentInputConfig {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: unknown }>; // para select/multiselect
  validation?: RegExp;
  description: string;
}

export interface ComponentConfig {
  component: Type<unknown>;
  name: string;
  description: string;
  inputs: ComponentInputConfig[];
  category: ComponentCategory;
  icon: string;
  previewTemplate?: string;
}

export type RegistryDefinition = Record<string, ComponentConfig>;
