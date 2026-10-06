import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the shell landmarks around the routed page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const shell = fixture.nativeElement as HTMLElement;

    expect(shell.querySelector('header')).not.toBeNull();
    expect(shell.querySelector('main#main-content router-outlet')).not.toBeNull();
    expect(shell.querySelector('footer')).not.toBeNull();
  });

  it('offers a skip link to the main content', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const skipLink = (fixture.nativeElement as HTMLElement).querySelector('a.skip-link');

    expect(skipLink?.getAttribute('href')).toBe('#main-content');
  });
});
