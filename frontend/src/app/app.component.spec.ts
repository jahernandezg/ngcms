import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('App root component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, App],
    });
  });
  it('should create', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
  it('should have title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const comp = fixture.componentInstance as App;
    expect((comp as unknown as { title: string }) .title).toBe('frontend');
  });
});
