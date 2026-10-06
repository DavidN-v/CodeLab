import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BRAND } from '../../core/config/brand.config';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly brand = BRAND;
  protected readonly currentYear = new Date().getFullYear();
}
