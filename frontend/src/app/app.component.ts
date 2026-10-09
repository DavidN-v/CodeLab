import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SettingsService } from './core/services/settings.service';
import { FooterComponent } from './layout/footer/footer.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { CelebrationOutletComponent } from './shared/components/celebration-outlet/celebration-outlet.component';
import { ToastOutletComponent } from './shared/components/toast-outlet/toast-outlet.component';

/** Application shell: persistent chrome around the routed page. */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastOutletComponent,
    CelebrationOutletComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    // Applies the saved theme and code font size before anything renders.
    inject(SettingsService);
  }
}
