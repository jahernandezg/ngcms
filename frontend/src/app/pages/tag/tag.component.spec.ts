import { TestBed } from '@angular/core/testing';
import { TagComponent } from './tag.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Title, Meta } from '@angular/platform-browser';

class TitleStub { value?: string; setTitle(v: string) { this.value = v; } }
interface MetaTag { [k: string]: string | undefined }
class MetaStub { tags: MetaTag[] = []; updateTag(t: MetaTag) { this.tags.push(t); } }

describe('TagComponent', () => {
  let param$!: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    param$ = new BehaviorSubject(convertToParamMap({ slug: 'testing' }));
    TestBed.configureTestingModule({
      imports: [TagComponent],
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

  const makeResp = (page: number) => ({
    success: true,
    message: 'ok',
    data: [{ id: 'p'+page, title: 'TagPost '+page, slug: 'tag-post-'+page, readingTime: 1, author: { id: 'a', name: 'Autor' }, categories: [] }],
    meta: { total: 15, page, limit: 10, totalPages: 2, tag: 'testing' }
  });

  it('SEO y paginación', () => {
    const fixture = TestBed.createComponent(TagComponent);
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('page') === '1').flush(makeResp(1));
    const comp = fixture.componentInstance;
    const title = TestBed.inject(Title) as unknown as TitleStub;
    expect(title.value).toContain('Tag: testing');
    comp.next();
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('page') === '2').flush(makeResp(2));
    comp.prev();
    fixture.detectChanges();
    httpMock.expectOne(r => r.params.get('page') === '1').flush(makeResp(1));
  });
});
