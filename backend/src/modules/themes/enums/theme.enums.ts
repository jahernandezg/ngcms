/**
 * Theme enums - These should match the enums defined in prisma/schema.prisma
 * This file provides TypeScript enums that can be used independently of the generated Prisma client
 */

export enum ThemeCategory {
  GENERAL = 'GENERAL',
  BUSINESS = 'BUSINESS',
  BLOG = 'BLOG',
  PORTFOLIO = 'PORTFOLIO',
  ECOMMERCE = 'ECOMMERCE',
  LANDING = 'LANDING',
  CREATIVE = 'CREATIVE',
  MINIMALIST = 'MINIMALIST',
}

export enum HeaderStyle {
  DEFAULT = 'DEFAULT',
  CENTERED = 'CENTERED',
  MINIMAL = 'MINIMAL',
  TRANSPARENT = 'TRANSPARENT',
  FIXED = 'FIXED',
  STICKY = 'STICKY',
  MEGA_MENU = 'MEGA_MENU',
  SIDEBAR = 'SIDEBAR',
}

export enum FooterStyle {
  DEFAULT = 'DEFAULT',
  MINIMAL = 'MINIMAL',
  COLUMNS = 'COLUMNS',
  CENTERED = 'CENTERED',
  NEWSLETTER = 'NEWSLETTER',
  SOCIAL = 'SOCIAL',
}

export enum ButtonStyle {
  ROUNDED = 'ROUNDED',
  SQUARE = 'SQUARE',
  PILL = 'PILL',
  OUTLINED = 'OUTLINED',
  GHOST = 'GHOST',
}

export enum CardStyle {
  ELEVATED = 'ELEVATED',
  FLAT = 'FLAT',
  OUTLINED = 'OUTLINED',
  MINIMAL = 'MINIMAL',
  GLASS = 'GLASS',
}

export enum ShadowStyle {
  NONE = 'NONE',
  SOFT = 'SOFT',
  MEDIUM = 'MEDIUM',
  STRONG = 'STRONG',
  COLORED = 'COLORED',
}

// Export all enum values as arrays for validation
export const THEME_CATEGORY_VALUES = Object.values(ThemeCategory);
export const HEADER_STYLE_VALUES = Object.values(HeaderStyle);
export const FOOTER_STYLE_VALUES = Object.values(FooterStyle);
export const BUTTON_STYLE_VALUES = Object.values(ButtonStyle);
export const CARD_STYLE_VALUES = Object.values(CardStyle);
export const SHADOW_STYLE_VALUES = Object.values(ShadowStyle);