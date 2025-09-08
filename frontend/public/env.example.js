// Copia este archivo como env.js en tu hosting (junto a index.html)
// y ajusta los valores. La app leerá window.__env en tiempo de ejecución.
window.__env = {
  // Base del backend sin slash final. El interceptor derivará /api y /uploads.
  // Ejemplo producción:
  // API_BASE: 'https://api.tublog.com',

  // Alternativa: URL completa de la API (termina en /api). El interceptor derivará la base quitando /api.
  // API_URL: 'https://api.tublog.com/api',
};
