import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HomeDataService } from './home-data.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('HomeComponent + HomeDataService (signals)', () => {
  let httpMock: HttpTestingController;
  let svc: HomeDataService;

  const makeResponse = (page: number, totalPages = 2) => ({
    success: true,
    message: 'ok',
    data: [
      {
        id: 'p' + page,
        title: 'Post ' + page,
        slug: 'post-' + page,
        excerpt: 'Excerpt ' + page,
        readingTime: 3,
        author: { id: 'a1', name: 'Auth' },
        categories: [],
      },
    ],
    meta: { total: 15, page, limit: 10, totalPages },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map() }, queryParamMap: of(new Map()) } }
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(HomeDataService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads first page on init (blog fallback)', () => {
    const f = TestBed.createComponent(HomeComponent);
    f.detectChanges();
    // homepage request fallará -> fallback blog
    const hpReq = httpMock.expectOne('/api/pages/homepage');
    hpReq.flush({ success: true, data: null });
    const postsReq = httpMock.expectOne(r => r.params.get('page') === '1');
    postsReq.flush(makeResponse(1));
    expect(svc.items().length).toBe(1);
  });

  it('next / prev navigation bounded', () => {
  const f = TestBed.createComponent(HomeComponent);
  f.detectChanges();
  httpMock.expectOne('/api/pages/homepage').flush({ success: true, data: null });
  httpMock.expectOne(r => r.params.get('page') === '1').flush(makeResponse(1));

    svc.prev();
    expect(httpMock.match(r => r.params.get('page') === '0').length).toBe(0);

    svc.next();
    httpMock.expectOne(r => r.params.get('page') === '2').flush(makeResponse(2));

    svc.next();
    expect(httpMock.match(r => r.params.get('page') === '3').length).toBe(0);

    svc.prev();
    httpMock.expectOne(r => r.params.get('page') === '1').flush(makeResponse(1));
  });

  it('setPage triggers fetch', () => {
  const f = TestBed.createComponent(HomeComponent);
  f.detectChanges();
  httpMock.expectOne('/api/pages/homepage').flush({ success: true, data: null });
  httpMock.expectOne(r => r.params.get('page') === '1').flush(makeResponse(1, 3));
    svc.setPage(3);
    httpMock.expectOne(r => r.params.get('page') === '3').flush(makeResponse(3, 3));
    expect(svc.page()).toBe(3);
  });

  it('redundant setPage does not refetch', () => {
  const f = TestBed.createComponent(HomeComponent);
  f.detectChanges();
  httpMock.expectOne('/api/pages/homepage').flush({ success: true, data: null });
  const initialReq = httpMock.expectOne(r => r.params.get('page') === '1');
    initialReq.flush(makeResponse(1));
    const before = httpMock.match(() => true).length;
    svc.setPage(1);
    const after = httpMock.match(() => true).length;
    expect(after).toBe(before); // no new requests
  });

  it('handles error', () => {
  const f = TestBed.createComponent(HomeComponent);
  f.detectChanges();
  httpMock.expectOne('/api/pages/homepage').flush({ success: true, data: null });
  const req = httpMock.expectOne(r => r.params.get('page') === '1');
    req.flush('boom', { status: 500, statusText: 'Server Error' });
    expect(svc.error()).toBeTruthy();
  });
});
