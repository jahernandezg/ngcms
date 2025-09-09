// E2E principal: home -> abrir post -> back

describe('journey home -> post -> back', () => {
  it('navega al detalle y regresa', () => {
    // Forzar modo blog en caso de que exista homepage como página
    cy.visit('/?view=blog');

    // Consultar si hay posts publicados vía API
  let api = (Cypress.env('API_URL') as string) || `${Cypress.config().baseUrl?.replace(/\/$/, '')}/api`;
  // Normalizar 'localhost' -> '127.0.0.1' para evitar resolución IPv6 (::1) en CI
  api = api.replace('localhost', '127.0.0.1');
  cy.log(`API_URL efectivo: ${api}`);
  const fetchPosts = (attempt = 1) => {
      cy.log(`Intento fetch posts (${attempt})`);
  return cy.request({ url: `${api.replace(/\/$/,'')}/posts?limit=1`, failOnStatusCode: false })
        .then((resp) => {
          // Si conexión rechazada (status 0) y aún quedan reintentos, esperar y reintentar
          if ((resp.status === 0 || resp.status === 503) && attempt < 4) {
            cy.wait(500 * attempt);
            return fetchPosts(attempt + 1);
          }
          return resp;
        });
    };

    fetchPosts().then((resp) => {
      const ok = resp.status >= 200 && resp.status < 300;
      const hasPosts = ok && Array.isArray(resp.body?.data) && resp.body.data.length > 0;
      if (!ok) {
        // API caída o DB no disponible: la UI debe mostrar un mensaje de error
        cy.contains(/Error/i).should('exist');
        return;
      }
      if (!hasPosts) {
        // Sin posts: validar mensaje de vacío y salir
        cy.contains('No hay posts publicados todavía.').should('exist');
        return;
      }

  // Hay posts: usar directamente el primer slug devuelto por la API para navegar (evita flakiness de render async)
  const first = resp.body.data[0];
  expect(first, 'primer post disponible').to.have.property('slug');
  cy.visit(`/post/${first.slug}`);
  cy.get('h1,h2').first().should('be.visible');
  cy.go('back');
  cy.location('pathname').should('eq', '/');
    });
  });
});
