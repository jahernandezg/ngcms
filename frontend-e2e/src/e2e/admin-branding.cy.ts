// E2E: Admin Branding - subir logo y guardar

describe('admin branding', () => {
  before(() => {
    // TODO: crear usuario admin si no existe vía API/CLI.
  });

  it('login, navega a Branding, guarda y sube favicon', () => {
    cy.visit('/admin/login');
    // login simple (ajusta los selectores según tu UI)
    cy.get('input[type="email"]').type(Cypress.env('ADMIN_EMAIL') || 'admin@example.com');
    cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD') || 'changeme');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/admin');

    // Ir a Branding
    cy.visit('/admin/settings/branding');
    cy.contains('Identidad y Branding');

    // Cambiar nombre del blog
    const newName = `Blog ${Date.now()}`;
  cy.get('input#blogName').clear();
  cy.get('input#blogName').type(newName);

    // Guardar
    cy.contains('button', 'Guardar').click();
    cy.contains('Guardado');

    // Subir favicon (usa un archivo de pruebas existente en fixtures)
    const fileName = 'example.png';
    cy.fixture(fileName, 'base64').then(fileContent => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/png');
      const testFile = new File([blob], fileName, { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      cy.get('input#favicon').parent().find('input[type=file]').then(($input) => {
        const input = $input[0] as HTMLInputElement;
        input.files = dataTransfer.files;
        $input.trigger('change', { force: true });
      });
    });

    // Ver que la caja de texto de favicon ha recibido una URL
    cy.get('input#favicon').should(($el) => {
      const val = ($el[0] as HTMLInputElement).value;
      expect(val).to.match(/^\/uploads\//);
    });
  });
});
