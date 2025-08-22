import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthorComponent } from './author.component';
import { BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

describe('AuthorComponent', () => {
  beforeEach(() => {
  const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'autor-demo' }));
    const getMock = jest.fn().mockReturnValue(of({ success: true, message: 'ok', data: { id: 'abc', name: 'Autor', posts: [] } }));
    TestBed.configureTestingModule({
      imports: [AuthorComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: HttpClient, useValue: { get: getMock } }
      ]
    });
  });

  it('crea componente author', () => {
    const fixture = TestBed.createComponent(AuthorComponent);
    fixture.detectChanges();
  expect(fixture.componentInstance).toBeTruthy();
  });
});
