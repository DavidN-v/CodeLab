import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthCardComponent } from './auth-card.component';

@Component({
  imports: [AuthCardComponent],
  template: '<app-auth-card heading="Entrar" lead="Bienvenido"><form>campos</form></app-auth-card>',
})
class HostComponent {}

describe('AuthCardComponent', () => {
  it('frames the projected form under a heading', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe('Entrar');
    expect(element.querySelector('form')?.textContent).toBe('campos');
  });
});
