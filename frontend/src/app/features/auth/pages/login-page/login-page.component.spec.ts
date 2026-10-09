import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppError } from '../../../../core/models/api-error.model';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let element: HTMLElement;
  let login: ReturnType<typeof vi.fn>;

  function fill(email: string, password: string): void {
    const emailInput = element.querySelector<HTMLInputElement>('#login-email')!;
    const passwordInput = element.querySelector<HTMLInputElement>('#login-password')!;
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
  }

  beforeEach(async () => {
    login = vi.fn();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('does not call the API while the form is invalid', () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(login).not.toHaveBeenCalled();
    expect(element.querySelectorAll('.field__error')).toHaveLength(2);
  });

  it('signs in and goes back to where the learner was heading', () => {
    login.mockReturnValue(
      of({ id: 1, email: 'ada@example.com', displayName: 'Ada', dailyGoalXp: 30 }),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('returnUrl', '/practice/hola-mundo');

    fill('ada@example.com', 'secreta123');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secreta123' });
    expect(navigate).toHaveBeenCalledWith('/practice/hola-mundo');
  });

  it('ignores return URLs that leave the app', () => {
    login.mockReturnValue(
      of({ id: 1, email: 'ada@example.com', displayName: 'Ada', dailyGoalXp: 30 }),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('returnUrl', '//evil.example.com');

    fill('ada@example.com', 'secreta123');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('explains wrong credentials inline', () => {
    login.mockReturnValue(throwError(() => new AppError(401, 'UNAUTHORIZED', 'Sesión no válida')));

    fill('ada@example.com', 'mala-clave');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'El correo o la contraseña no son correctos.',
    );
  });
});
