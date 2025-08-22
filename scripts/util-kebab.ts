export function kebabCase(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\p{Letter}\p{Number}]+/gu,'-')
    .replace(/^-+|-+$/g,'')
    .replace(/-{2,}/g,'-');
}
