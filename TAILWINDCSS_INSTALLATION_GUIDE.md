# Guía de Instalación de Tailwind CSS v4 (Angular 20 + Nx)

Esta guía detalla cómo instalar y configurar Tailwind CSS v4.1.3 en el contexto usado aquí: Angular 20 + Nx (proyecto `frontend`). Incluye ajustes de dark mode, variables CSS y notas de migración desde v3.

## 📋 Requisitos Previos

- Node.js ≥ 18
- Angular 20 / CLI equivalente (en Nx normalmente no invocas directamente `ng new`)
- Workspace Nx con aplicación Angular (`frontend/`)
- Recomendado: VSCode + extensión Tailwind CSS IntelliSense

## 🚀 Instalación Paso a Paso

### 1. Instalar las Dependencias de Tailwind CSS

Ejecuta en la raíz del workspace (misma carpeta de `package.json`):

```bash
npm install -D tailwindcss@^4.1.3 @tailwindcss/postcss@^4.1.3
```

**Nota:** Tailwind CSS v4 tiene una nueva arquitectura que simplifica la configuración comparada con v3.

### 2. Crear el Archivo de Configuración PostCSS

Si no existe, crea `.postcssrc.json` en la raíz del workspace (no dentro de `frontend/`):

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

### 3. Configurar los Estilos Globales

En este repo usamos `frontend/src/styles.scss` (puedes renombrar a `.css` para evitar la deprecación de `@import` de Sass). Contenido mínimo:

```scss
/* You can add global styles to this file, and also import other style files */
@import "tailwindcss";

/* Aquí puedes agregar tus estilos personalizados */
```

**Importante:** En Tailwind CSS v4, ya no necesitas `@tailwind base;`, `@tailwind components;` ni `@tailwind utilities;`: basta `@import "tailwindcss";`.

⚠️ Deprecación Sass: `@import` será removido en Dart Sass 3.0. Opciones:

1. Cambiar a `styles.css` (recomendado) y conservar `@import "tailwindcss";`.
2. Mantener `.scss` temporalmente (habrá warning de deprecación).

### 4. Verificar la Configuración de Angular / Nx

Con Nx, la inclusión de estilos se maneja en `frontend/project.json` (o `angular.json` si existiera). Asegura que `frontend/src/styles.scss` (o `.css`) esté listado en `build.options.styles`. Ejemplo (genérico Angular CLI):

```json
{
  "projects": {
    "tu-proyecto": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

### 5. Configuración del package.json

Ejemplo de secciones relevantes (el resto puede variar):

```json
{
  "dependencies": {
    "tailwindcss": "^4.1.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.3"
  }
}
```

## 🎨 Uso de Tailwind CSS

### Ejemplo Básico

Una vez instalado, puedes usar las clases de Tailwind en tus componentes:

```html
<div class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Botón con Tailwind CSS
</div>
```

### Clases Responsivas

```html
<div class="w-full md:w-1/2 lg:w-1/3">
  <p class="text-sm md:text-base lg:text-lg">Texto responsivo</p>
</div>
```

### Flexbox y Grid

```html
<div class="flex justify-center items-center min-h-screen">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Contenido -->
  </div>
</div>
```

## 🔧 Personalización (Opcional)

### Configuración Personalizada

Si necesitas personalizar Tailwind CSS v4, crea `tailwind.config.js` en la raíz. En Nx asegúrate de incluir las rutas correctas (`frontend/src/**`). Ejemplo base + dark mode + variables:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    'frontend/src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        'bg-app': 'var(--color-bg-app)',
        'text-app': 'var(--color-text-app)'
      },
      fontFamily: {
        custom: ['Custom Font', 'sans-serif']
      }
    }
  },
  plugins: []
}

Ejemplo de variables (en `styles.css`):

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #9333ea;
  --color-bg-app: #ffffff;
  --color-text-app: #1f2937;
}
.dark {
  --color-bg-app: #111315;
  --color-text-app: #e5e7eb;
}
```

Luego puedes usar: `class="bg-bg-app text-text-app"`.

### Estilos Personalizados

Puedes agregar estilos personalizados en `frontend/src/styles.(s)css` tras la importación Tailwind:

```scss
@import "tailwindcss";

/* Estilos personalizados */
.card-button {
  @apply bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-300;
}

.custom-shadow {
  @apply shadow-lg hover:shadow-xl transition-shadow duration-300;
}
```

## 🌗 Dark Mode

Configurado con `darkMode: 'class'`. Activa/desactiva añadiendo/removiendo `dark` en `<html>` o `<body>`:

```ts
// Ejemplo rápido
document.documentElement.classList.toggle('dark');
```

Ejemplo de markup:

```html
<div class="bg-bg-app text-text-app dark:bg-neutral-900 dark:text-neutral-100 p-4 rounded">Contenido</div>
```

## 📱 Clases Útiles para Responsividad

### Breakpoints en Tailwind CSS v4


### Ejemplos de Uso Responsivo

```html
<!-- Navegación responsiva -->
<nav class="flex flex-col md:flex-row justify-between items-center p-4">
  <div class="mb-4 md:mb-0">Logo</div>
  <div class="space-y-2 md:space-y-0 md:space-x-4 md:flex">
    <a href="#" class="block md:inline-block">Inicio</a>
    <a href="#" class="block md:inline-block">Productos</a>
    <a href="#" class="block md:inline-block">Contacto</a>
  </div>
</nav>

<!-- Grid responsivo -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <!-- Elementos del grid -->
</div>

<!-- Texto responsivo -->
<h1 class="text-2xl md:text-4xl lg:text-6xl font-bold">
  Título Responsivo
</h1>
```

## � IntelliSense (clases dinámicas)

Si generas clases dinámicamente en templates, añade a tu `settings.json` de VSCode:

```json
{
  "tailwindCSS.experimental.classRegex": [
    "['\"`]([^'\"`]*?)['\"`]"]
}
```

## �🚀 Comandos de Desarrollo (Nx)

### Iniciar el servidor de desarrollo

```bash
# Servir app frontend
npx nx serve frontend

# Build producción
npx nx build frontend

# (Opcional) ejecutar tests
npx nx test frontend
```

### Construir para producción

También puedes encadenar: `npx nx run-many -t build --all` para construir múltiples proyectos.

## 🐛 Solución de Problemas Comunes

### 1. Los estilos de Tailwind no se aplican

**Solución:**

- Verifica que el archivo `.postcssrc.json` existe y está configurado correctamente
- Asegúrate de que `@import "tailwindcss";` está al inicio de `src/styles.scss`
- Reinicia el servidor de desarrollo

### 2. Error de compilación PostCSS / plugin no encontrado

**Solución:**

```bash
# Limpia el cache de Node.js
npm cache clean --force

# Reinstala las dependencias
rimraf node_modules package-lock.json
npm install
```

### 3. Clases de Tailwind no reconocidas en VSCode

**Solución:**
Instala la extensión "Tailwind CSS IntelliSense" en VSCode:

1. Abre VSCode
2. Ve a Extensions (Ctrl+Shift+X)
3. Busca "Tailwind CSS IntelliSense"
4. Instala la extensión oficial de Tailwind Labs

### 4. Tamaño de bundle muy grande

**Solución:**
Tailwind CSS v4 incluye purging automático, pero puedes optimizar aún más:

```javascript
// En tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/**/*.component.html",
    "./src/**/*.component.ts"
  ],
  // ... resto de la configuración
}
```

### 5. Warning CommonJS (ej. Quill)

Si ves avisos sobre dependencias CommonJS (ej: Quill) y deseas silenciarlos, añade en la configuración de build Angular (`allowedCommonJsDependencies`):

```jsonc
"build": {
  "options": {
    "allowedCommonJsDependencies": ["quill"]
  }
}
```

### 6. Migración desde Tailwind v3 → v4 (resumen)

1. Elimina directivas `@tailwind base; components; utilities;` y usa solo `@import "tailwindcss";`.
2. Sustituye `postcss.config.cjs/js` por `.postcssrc.json` con `{"plugins": {"@tailwindcss/postcss": {}}}`.
3. Revisa `content:` (simplifica rutas, evita duplicados).
4. Limpia plugins no necesarios (la mayoría siguen funcionando sin cambios, pero verifica versiones).
5. Ajusta cualquier build script que referencie archivos removidos.
6. Verifica dark mode (si usabas `media`, decide si mantener o migrar a `class`).

## 📚 Recursos Adicionales

- [Documentación oficial de Tailwind CSS v4](https://tailwindcss.com/docs)
- [Guía de migración a v4](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Tailwind CSS Cheat Sheet](https://tailwindcomponents.com/cheatsheet/)

## ✅ Verificación de la Instalación

Para verificar que Tailwind CSS está funcionando correctamente:

1. Agrega esta clase temporal a cualquier elemento HTML:

```html
<div class="bg-red-500 text-white p-4 m-4 rounded">
  ¡Tailwind CSS está funcionando!
</div>
```

1. Si el elemento se muestra con fondo rojo, texto blanco y esquinas redondeadas, ¡la instalación fue exitosa!
2. Recuerda eliminar este elemento de prueba después de verificar.

---

**Nota:** Guía basada en Tailwind CSS v4.1.3 + Angular 20 + Nx 21. Ajusta según versiones futuras.
