import { TestBed } from '@angular/core/testing';
import { PageEditorComponent } from './page-editor.component';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

class ActivatedRouteStub { snapshot = { paramMap: new Map() }; }

describe('PageEditorComponent', () => {
  it('inicializa formulario para nueva página', () => {
    TestBed.configureTestingModule({
      imports: [PageEditorComponent],
      providers: [provideHttpClient(), { provide: ActivatedRoute, useClass: ActivatedRouteStub }]
    });
    const fixture = TestBed.createComponent(PageEditorComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.isNew()).toBe(true);
    expect(comp.form.value.title).toBe('');
  });
});
