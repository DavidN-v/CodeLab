import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationService } from '../../../core/services/notification.service';
import { ToastOutletComponent } from './toast-outlet.component';

describe('ToastOutletComponent', () => {
  let fixture: ComponentFixture<ToastOutletComponent>;
  let element: HTMLElement;
  let notifications: NotificationService;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [ToastOutletComponent] }).compileComponents();

    notifications = TestBed.inject(NotificationService);
    fixture = TestBed.createComponent(ToastOutletComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => vi.useRealTimers());

  it('keeps an empty live region mounted', () => {
    expect(element.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(element.querySelectorAll('.toast')).toHaveLength(0);
  });

  it('renders queued notifications and marks errors', () => {
    notifications.showError('No se pudo guardar.');
    fixture.detectChanges();

    const toast = element.querySelector('.toast');
    expect(toast?.textContent).toContain('No se pudo guardar.');
    expect(toast?.classList).toContain('toast--error');
  });

  it('removes a notification when it is dismissed', () => {
    notifications.showInfo('Progreso guardado.');
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.toast__dismiss')!.click();
    fixture.detectChanges();

    expect(element.querySelectorAll('.toast')).toHaveLength(0);
  });
});
