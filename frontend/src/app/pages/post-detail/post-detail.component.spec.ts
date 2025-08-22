import { TestBed } from '@angular/core/testing';
import { PostDetailComponent } from './post-detail.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Title, Meta } from '@angular/platform-browser';

class TitleStub { value?: string; setTitle(v: string) { this.value = v; } }
interface MetaTag { [k: string]: string | undefined }
class MetaStub { tags: MetaTag[] = []; updateTag(t: MetaTag) { this.tags.push(t); } }

describe('PostDetailComponent', () => {
  let param$!: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    param$ = new BehaviorSubject(convertToParamMap({ slug: 'uno' }));
    TestBed.configureTestingModule({
      imports: [PostDetailComponent],
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

  it('carga post, relacionados y genera jsonLd', () => {
    const fixture = TestBed.createComponent(PostDetailComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/posts/uno').flush({ success: true, message: 'ok', data: { id: '1', title: 'Post Uno', slug: 'uno', content: '<p>Contenido</p>', excerpt: 'Exc', readingTime: 2, viewCount: 5, author: { id:'a', name:'Autor'}, categories: [], tags: [] } });
    httpMock.expectOne('/api/posts/uno/related').flush({ success: true, message: 'ok', data: [{ id: '2', title: 'Relacionado', slug: 'rel', content: '', readingTime: 1, viewCount: 0, author: { id:'a', name:'Autor'}, categories: [], tags: [] }] });
  fixture.detectChanges();
    const comp = fixture.componentInstance;
    const json = JSON.parse(comp.jsonLd());
    expect(json.headline).toBe('Post Uno');
    const title = TestBed.inject(Title) as unknown as TitleStub;
    expect(title.value).toContain('Post Uno');
  });
});
