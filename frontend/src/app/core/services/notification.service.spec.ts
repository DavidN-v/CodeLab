import { TestBed } from '@angular/core/testing';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => vi.useRealTimers());

  it('queues notifications in the order they were shown', () => {
    service.showError('Primero');
    service.showInfo('Segundo');

    expect(service.notifications().map((n) => [n.kind, n.message])).toEqual([
      ['error', 'Primero'],
      ['info', 'Segundo'],
    ]);
  });

  it('does not stack a message that is already visible', () => {
    service.showError('Sin conexión');
    service.showError('Sin conexión');

    expect(service.notifications()).toHaveLength(1);
  });

  it('dismisses a notification by id', () => {
    service.showError('Primero');
    service.showError('Segundo');
    const [first] = service.notifications();

    service.dismiss(first.id);

    expect(service.notifications().map((n) => n.message)).toEqual(['Segundo']);
  });

  it('dismisses notifications automatically after a while', () => {
    service.showInfo('Temporal');

    vi.advanceTimersByTime(6000);

    expect(service.notifications()).toHaveLength(0);
  });
});
