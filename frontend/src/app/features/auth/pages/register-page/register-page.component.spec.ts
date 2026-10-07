import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppError } from '../../../../core/models/api-error.model';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterPageComponent } from './register-page.component';

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let element: HTMLElement;
  let register: ReturnType<typeof vi.fn>;

  function type(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(async () => {
    register = vi.fn();
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { register } }],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterPageComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('requires a password of at least 8 characters', () => {
    type('#register-name', 'Ada');
    type('#register-email', 'ada@example.com');
    type('#register-password', 'corta');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(register).not.toHaveBeenCalled();
    expect(element.textContent).toContain('entre 8 y 72 caracteres');
  });

  it('creates the account and lands on the dashboard', () => {
    register.mockReturnValue(
      of({ id: 1, email: 'ada@example.com', displayName: 'Ada', dailyGoalXp: 30 }),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    type('#register-name', '  Ada ');
    type('#register-email', 'ada@example.com');
    type('#register-password', 'una-clave-larga');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(register).toHaveBeenCalledWith({
      displayName: 'Ada',
      email: 'ada@example.com',
      password: 'una-clave-larga',
    });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows the reason when the email is taken', () => {
    register.mockReturnValue(
      throwError(() => new AppError(409, 'CONFLICT', 'Ya existe una cuenta con ese correo.')),
    );

    type('#register-name', 'Ada');
    type('#register-email', 'ada@example.com');
    type('#register-password', 'una-clave-larga');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Ya existe una cuenta');
  });
});
