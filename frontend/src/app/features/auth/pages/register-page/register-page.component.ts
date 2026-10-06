import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AppError } from '../../../../core/models/api-error.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthCardComponent } from '../../components/auth-card/auth-card.component';
import { safeReturnUrl } from '../../return-url';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    displayName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
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
    const value = this.form.getRawValue();
    this.auth.register({ ...value, displayName: value.displayName.trim() }).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: (failure: AppError) => {
        this.submitting.set(false);
        this.error.set(failure.message);
      },
    });
  }
}
