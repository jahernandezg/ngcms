// Copia este archivo como env.js en tu hosting (mismo directorio que index.html)
// y ajusta los valores. La app leerá window.__env en tiempo de ejecución.
// IMPORTANTE: nuestro workflow de deploy por FTP limpia la carpeta remota ANTES de subir,
// pero PRESERVA el archivo env.js si existe (no se borra ni se reemplaza).
// Así puedes mantener una config distinta por cada instancia sin recompilar.
window.__env = {
  // Base del backend sin slash final. El interceptor derivará /api y /uploads.
  // Producción (ejemplo real del proyecto):
  // API_BASE: 'https://api.tsinit.com',

  // Alternativa: URL completa de la API (termina en /api). El interceptor derivará la base quitando /api.
  // API_URL: 'https://api.tsinit.com/api',

  // URL pública del sitio (para construir canonical y og:url en cliente)
  // SITE_URL: 'https://tsinit.com'
};
