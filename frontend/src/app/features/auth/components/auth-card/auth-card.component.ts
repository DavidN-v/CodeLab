import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Frame shared by the login and register forms. */
@Component({
  selector: 'app-auth-card',
  templateUrl: './auth-card.component.html',
  styleUrl: './auth-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCardComponent {
  readonly heading = input.required<string>();
  readonly lead = input.required<string>();
}
