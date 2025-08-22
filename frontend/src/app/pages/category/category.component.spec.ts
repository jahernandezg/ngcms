import { TestBed } from '@angular/core/testing';
import { CategoryComponent } from './category.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Title, Meta } from '@angular/platform-browser';

class TitleStub { value?: string; setTitle(v: string) { this.value = v; } }
interface MetaTag { [k: string]: string | undefined }
class MetaStub { tags: MetaTag[] = []; updateTag(t: MetaTag) { this.tags.push(t); } }

const makeResponse = (page: number) => ({
  success: true,
  message: 'ok',
  data: [{ id: 'p'+page, title: 'Post '+page, slug: 'post-'+page, readingTime: 1, author: { id: 'a', name: 'Autor' }, categories: [] }],
  meta: { total: 30, page, limit: 10, totalPages: 3, category: 'angular' }
});

describe('CategoryComponent', () => {
  let param$!: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    param$ = new BehaviorSubject(convertToParamMap({ slug: 'angular' }));
    TestBed.configureTestingModule({
      imports: [CategoryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: param$.asObservable() } },
        { provide: Title, useClass: TitleStub },
        { provide: Meta, useClass: MetaStub }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carga inicial y SEO', () => {
    const fixture = TestBed.createComponent(CategoryComponent);
    fixture.detectChanges();
  httpMock.expectOne(req => req.url.startsWith('/api/category/angular') && req.params.get('page') === '1')
      .flush(makeResponse(1));
    const title = TestBed.inject(Title) as unknown as TitleStub;
    expect(title.value).toContain('Categoría: angular');
  });

  it('next y prev actualizan página y disparan fetch', () => {
    const fixture = TestBed.createComponent(CategoryComponent);
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('page') === '1').flush(makeResponse(1));
    const comp = fixture.componentInstance;
    comp.next();
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('page') === '2').flush(makeResponse(2));
    comp.next();
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('page') === '3').flush(makeResponse(3));
    comp.next(); // no más requests
    fixture.detectChanges();
    comp.prev();
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('page') === '2').flush(makeResponse(2));
  });
});
