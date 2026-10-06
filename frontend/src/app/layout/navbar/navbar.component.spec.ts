import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { NavbarComponent } from './navbar.component';
import { NAV_LINKS } from './navbar-links';

@Component({ template: '' })
class DestinationStubComponent {}

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      // Every link needs somewhere to go, or clicking it ends in a navigation error.
      providers: [provideHttpClient(), provideRouter([{ path: '**', component: DestinationStubComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('invites signed-out visitors to sign in or register', () => {
    const account = element.querySelector('.navbar__account')!;

    expect(account.querySelector('a[href="/login"]')).not.toBeNull();
    expect(account.querySelector('a[href="/register"]')).not.toBeNull();
  });

  it('renders one link per navigation entry, in order', () => {
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.navbar__link'));

    expect(links.map((link) => link.textContent?.trim())).toEqual(NAV_LINKS.map((l) => l.label));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(NAV_LINKS.map((l) => l.path));
  });

  it('opens and closes the collapsed menu from the toggle', () => {
    const toggle = element.querySelector<HTMLButtonElement>('.navbar__toggle')!;
    const nav = element.querySelector<HTMLElement>('.navbar__nav')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList).toContain('navbar__nav--open');

    toggle.click();
    fixture.detectChanges();
    expect(nav.classList).not.toContain('navbar__nav--open');
  });

  it('closes the menu after choosing a destination', async () => {
    element.querySelector<HTMLButtonElement>('.navbar__toggle')!.click();
    fixture.detectChanges();

    element.querySelector<HTMLAnchorElement>('.navbar__link')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('.navbar__nav')!.classList).not.toContain('navbar__nav--open');
  });
});
