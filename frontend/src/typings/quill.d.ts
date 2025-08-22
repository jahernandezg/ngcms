// Minimal declaration to satisfy TypeScript for dynamic import of quill
// For richer typing install: npm i -D @types/quill
declare module 'quill' {
  const Quill: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  export default Quill;
}
