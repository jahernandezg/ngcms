import { TestBed } from '@angular/core/testing';
import { PageDetailComponent } from './page-detail.component';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

// Minimal smoke test

describe('PageDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageDetailComponent],
      providers: [
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['slug','about']])) } },
        { provide: 'Window', useValue: window }
      ]
    }).compileComponents();
  });

  it('creates component', () => {
    const fixture = TestBed.createComponent(PageDetailComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});
