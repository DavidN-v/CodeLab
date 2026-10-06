import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AppError } from '../../../../core/models/api-error.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthCardComponent } from '../../components/auth-card/auth-card.component';
import { safeReturnUrl } from '../../return-url';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query parameter: where the learner was going before being asked to sign in. */
  readonly returnUrl = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: (failure: AppError) => {
        this.submitting.set(false);
        this.error.set(
          failure.status === 401 ? 'El correo o la contraseña no son correctos.' : failure.message,
        );
      },
    });
  }
}
