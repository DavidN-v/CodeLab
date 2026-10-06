import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Language } from '../../../../core/models/language.model';
import { HeroComponent } from './hero.component';

const JAVA: Language = {
  id: 1,
  slug: 'java',
  name: 'Java',
  version: '21',
  icon: 'java',
  tagline: 'Aprende Java desde cero.',
  description: null,
  active: true,
};

describe('HeroComponent', () => {
  let fixture: ComponentFixture<HeroComponent>;
  let element: HTMLElement;

  function actionLabels(): (string | undefined)[] {
    return Array.from(element.querySelectorAll('.hero__actions a')).map((a) =>
      a.textContent?.trim(),
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('states what the platform does', () => {
    fixture.detectChanges();

    expect(element.querySelector('h1')?.textContent).toContain('Aprende a programar construyendo.');
  });

  it('only offers to browse while there is no featured language', () => {
    fixture.detectChanges();

    expect(actionLabels()).toEqual(['Explorar lenguajes']);
  });

  it('starts with the featured language once it is known', () => {
    fixture.componentRef.setInput('featuredLanguage', JAVA);
    fixture.detectChanges();

    expect(actionLabels()).toEqual(['Comenzar con Java', 'Explorar lenguajes']);
    expect(element.querySelector('.button--primary')?.getAttribute('href')).toBe('/languages/java');
    expect(element.querySelector('.hero__eyebrow')?.textContent).toContain('Java 21');
  });
});
