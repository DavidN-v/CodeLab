import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'error' | 'info';

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  message: string;
}

const AUTO_DISMISS_MS = 6000;

/** Queue of transient messages rendered by the toast outlet. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly queue = signal<readonly AppNotification[]>([]);
  private nextId = 1;

  readonly notifications = this.queue.asReadonly();

  showError(message: string): void {
    this.push('error', message);
  }

  showInfo(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.queue.update((current) => current.filter((notification) => notification.id !== id));
  }

  private push(kind: NotificationKind, message: string): void {
    // A burst of failing requests should not stack identical toasts.
    if (this.queue().some((existing) => existing.kind === kind && existing.message === message)) {
      return;
    }
    const id = this.nextId++;
    this.queue.update((current) => [...current, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
