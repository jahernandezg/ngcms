import { TestBed } from '@angular/core/testing';
import { PageListComponent } from './page-list.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

class HttpClientStub { get() { return of({ items: [], total: 0 }); } }

describe('PageListComponent', () => {
  it('carga listado inicial', () => {
    TestBed.configureTestingModule({
      imports: [PageListComponent, RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: 'HttpClient', useClass: HttpClientStub }
      ]
    });
    const fixture = TestBed.createComponent(PageListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.pages().length).toBe(0);
  });
});
