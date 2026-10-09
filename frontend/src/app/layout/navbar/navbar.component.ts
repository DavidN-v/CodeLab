import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { BRAND } from '../../core/config/brand.config';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { NAV_LINKS } from './navbar-links';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly settings = inject(SettingsService);

  protected readonly brandName = BRAND.name;
  protected readonly user = this.auth.user;
  protected readonly links = NAV_LINKS;

  /** Only meaningful on narrow screens, where the links collapse behind a toggle. */
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.closeMenu();
    void this.router.navigateByUrl('/');
  }
}
