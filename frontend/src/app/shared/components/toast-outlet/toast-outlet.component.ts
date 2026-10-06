import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';

/** Renders the notification queue. Mounted once, in the application shell. */
@Component({
  selector: 'app-toast-outlet',
  templateUrl: './toast-outlet.component.html',
  styleUrl: './toast-outlet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutletComponent {
  private readonly notificationService = inject(NotificationService);

  protected readonly notifications = this.notificationService.notifications;

  protected dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
