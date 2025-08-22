import { TestBed } from '@angular/core/testing';
import { SearchComponent, SEARCH_DEBOUNCE_MS } from './search.component';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

class RouterStub { 
  constructor(private updateQuery: (qp: Record<string, string | number | undefined | null>) => void) {}
  navigate = jest.fn().mockImplementation((_commands: unknown[], opts: { queryParams?: Record<string, unknown> } | undefined) => {
    const qpRaw = { ...(opts?.queryParams || {}) };
    // Normalizar eliminando null y asegurando tipos válidos
    const qp: Record<string, string | number | null | undefined> = {};
    Object.keys(qpRaw).forEach(k => {
      const v = qpRaw[k];
      if (v == null || typeof v === 'string' || typeof v === 'number') {
        qp[k] = v as string | number | null | undefined;
      }
    });
    this.updateQuery(qp);
    return Promise.resolve(true);
  });
  createUrlTree(): object { return {}; }
  serializeUrl(): string { return ''; }
  readonly events = new Subject<unknown>();
}

describe('SearchComponent', () => {
  let param$!: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let queryParam$!: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let http: HttpClient;

  beforeEach(() => {
    param$ = new BehaviorSubject(convertToParamMap({}));
	queryParam$ = new BehaviorSubject(convertToParamMap({ q: '', page: '1' }));
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
    provideHttpClient(),
        { provide: ActivatedRoute, useValue: { paramMap: param$.asObservable(), queryParamMap: queryParam$.asObservable() } },
        { provide: Router, useFactory: () => new RouterStub((qp) => {
          const current = Object.fromEntries(queryParam$.value.keys.map(k => [k, queryParam$.value.get(k)]));
          const merged = { ...current, ...qp };
          queryParam$.next(convertToParamMap(merged));
        }) },
        { provide: SEARCH_DEBOUNCE_MS, useValue: 0 }
      ]
    });
  http = TestBed.inject(HttpClient);
  });

  const delay = () => new Promise(res => setTimeout(res, 0));

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sincroniza query params y realiza búsqueda + sugerencias', async () => {
  const getSpy = jest.spyOn(http, 'get').mockImplementation((url: string, opts?: { [key: string]: any }) => {
      const q = opts?.["params"]?.get?.('q');
      if (url.includes('/api/search/suggest')) {
        return of({ titles: q ? [q + 'X'] : [], tags: [] });
      }
  if (url === '/api/search') {
        const page = opts?.["params"]?.get?.('page') || '1';
        return of({ success: true, message: 'ok', data: q ? [{ id: '1', title: q, slug: 's', readingTime: 1, author: { id: 'a', name: 'Autor' }, categories: [] }] : [], meta: { total: q?1:0, page: Number(page), limit: 10, totalPages: 2, q } });
      }
      return of({});
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
  comp.setQ('init');
    fixture.detectChanges();
    await delay();
  comp.setQ('Angular');
    fixture.detectChanges();
    await delay();
  expect(getSpy).toHaveBeenCalled();
  // Validar que los signals tengan datos coherentes
  expect(comp.q()).toBe('Angular');
  expect(comp.posts().length).toBe(1);
  });

  it('paginación next/prev', async () => {
  const getSpy = jest.spyOn(http, 'get').mockImplementation((url: string, opts?: { [key: string]: any }) => {
      const q = opts?.["params"]?.get?.('q');
      if (url.includes('/api/search/suggest')) {
        return of({ titles: q ? [q + 'X'] : [], tags: [] });
      }
  if (url === '/api/search') {
        const page = opts?.["params"]?.get?.('page') || '1';
        return of({ success: true, message: 'ok', data: q ? [{ id: '1', title: q, slug: 's', readingTime: 1, author: { id: 'a', name: 'Autor' }, categories: [] }] : [], meta: { total: q?1:0, page: Number(page), limit: 10, totalPages: 3, q } });
      }
      return of({});
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.setQ('test');
    fixture.detectChanges();
    await delay();
    comp.next();
    fixture.detectChanges();
    await delay();
    comp.prev();
    fixture.detectChanges();
    await delay();
    expect(comp.page()).toBe(1);
  expect(getSpy.mock.calls.filter(c => (c[0] as string) === '/api/search').length).toBeGreaterThanOrEqual(2);
  });
});
