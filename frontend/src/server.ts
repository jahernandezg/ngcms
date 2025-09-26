import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const isProd = process.env['NODE_ENV'] === 'production';
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    // En dev (sin hashing de nombres) no cachear para ver cambios inmediatos
    maxAge: isProd ? '1y' : '0',
    index: false,
    redirect: false,
  })
);

if (!isProd) {
  // Desactivar cache para recursos servidos (defensa adicional)
  app.use((_, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
}

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) return next();
      const contentType = response.headers.get('content-type') || '';
      // Inyección GA4 en SSR sólo para HTML
      if (contentType.includes('text/html')) {
        const analyticsId = process.env['ANALYTICS_ID'];
        const siteUrl = process.env['SITE_URL'];
        let html = await response.text();
        // Build base URL from headers (supports proxies) and absolute URL for this request
        const xfProto = req.get('x-forwarded-proto');
        const xfHost = req.get('x-forwarded-host');
        const protocol = (xfProto || req.protocol || 'https').split(',')[0];
        const host = (xfHost || req.get('host') || '').split(',')[0];
        const baseUrl = host ? `${protocol}://${host}` : '';
        const absUrl = baseUrl ? `${baseUrl}${req.originalUrl}` : req.originalUrl;
        // Ensure minimal social sharing meta for crawlers (LinkedIn/Twitter) on SSR output
        // 1) og:url absolute for current page
        if (!/property=["']og:url["']/i.test(html) && absUrl) {
          html = html.replace('</head>', `\n<meta property=\"og:url\" content=\"${absUrl}\"/>\n</head>`);
        }
        // 2) og:title from <title> or fallback
        if (!/property=["']og:title["']/i.test(html)) {
          const titleMatch = html.match(/<title[^>]*>([^<]*)<\\/title>/i);
          const ogTitle = (titleMatch?.[1] || 'TSInit').trim();
          html = html.replace('</head>', `\n<meta property=\"og:title\" content=\"${ogTitle}\"/>\n<meta name=\"twitter:title\" content=\"${ogTitle}\"/>\n</head>`);
        }
        // 3) description from meta[name=description] or fallback
        if (!/property=["']og:description["']/i.test(html)) {
          const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i);
          const desc = (descMatch?.[1] || 'Artículos sobre Angular, NestJS, Nx y más.').trim();
          html = html.replace('</head>', `\n<meta property=\"og:description\" content=\"${desc}\"/>\n<meta name=\"twitter:description\" content=\"${desc}\"/>\n</head>`);
        }
        // 4) Ensure twitter:card
        if (!/name=["']twitter:card["']/i.test(html)) {
          html = html.replace('</head>', `\n<meta name=\"twitter:card\" content=\"summary_large_image\"/>\n</head>`);
        }
        // 5) og:image absolute - prefix baseUrl if relative, or add default
        const hasOgImage = /<meta\s+property=["']og:image["'][^>]*>/i.test(html);
        if (hasOgImage) {
          // prefix relative og:image with baseUrl
          html = html.replace(/(<meta\s+property=["']og:image["']\s+content=["'])(\/[^"]+)(["'][^>]*>)/i, `$1${baseUrl}$2$3`);
          // do the same for twitter:image if present
          html = html.replace(/(<meta\s+name=["']twitter:image["']\s+content=["'])(\/[^"]+)(["'][^>]*>)/i, `$1${baseUrl}$2$3`);
        } else {
          const defaultImg = baseUrl ? `${baseUrl}/main-product.png` : '/main-product.png';
          html = html.replace('</head>', `\n<meta property=\"og:image\" content=\"${defaultImg}\"/>\n<meta name=\"twitter:image\" content=\"${defaultImg}\"/>\n</head>`);
        }
        if (analyticsId && !html.includes('www.googletagmanager.com/gtag/js')) {
          const ga = `\n<script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${analyticsId}');</script>\n`;
          html = html.replace('</head>', `${ga}</head>`);
        }
        // Inyectar canonical si falta y disponemos de SITE_URL y un og:url absoluto que indique la ruta
        if (siteUrl) {
          // Exponer window.SITE_URL para el cliente (útil si env.js no existe)
          if (!html.includes('window.SITE_URL')) {
            const exposer = `\n<script>window.SITE_URL=${JSON.stringify(siteUrl)};</script>\n`;
            html = html.replace('</head>', `${exposer}</head>`);
          }
          if (!/rel=["']canonical["']/.test(html)) {
            // Intentar usar og:url si es absoluto y empieza por SITE_URL
            const ogUrlMatch = html.match(/property=["']og:url["']\s+content=["']([^"']+)["']/i);
            const ogAbs = ogUrlMatch?.[1];
            if (ogAbs && ogAbs.startsWith(siteUrl)) {
              const canonicalLink = `\n<link rel="canonical" href="${ogAbs}"/>\n`;
              html = html.replace('</head>', `${canonicalLink}</head>`);
            }
          }
        }
        // Also add canonical if still missing using absUrl
        if (!/rel=["']canonical["']/i.test(html) && typeof absUrl !== 'undefined' && absUrl) {
          const canonicalLink = `\n<link rel=\"canonical\" href=\"${absUrl}\"/>\n`;
          html = html.replace('</head>', `${canonicalLink}</head>`);
        }
        res.status(response.status);
        response.headers.forEach((v, k) => { if (k.toLowerCase() !== 'content-length') res.setHeader(k, v); });
        return res.send(html);
      }
      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.warn(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
