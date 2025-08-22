import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MenuListComponent } from './menu-list.component';

describe('MenuListComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MenuListComponent]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('carga items iniciales', () => {
    const fixture = TestBed.createComponent(MenuListComponent);
    fixture.detectChanges();
    const req = http.expectOne('/api/admin/menu');
    req.flush([]);
    fixture.detectChanges();
    expect(fixture.componentInstance.items().length).toBe(0);
  });
});
