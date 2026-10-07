import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { AppError } from '../../../core/models/api-error.model';
import { TutorService } from '../../../core/services/tutor.service';
import { TutorPanelComponent } from './tutor-panel.component';

describe('TutorPanelComponent', () => {
  let fixture: ComponentFixture<TutorPanelComponent>;
  let element: HTMLElement;

  async function render(enabled: boolean, ask: () => Observable<string>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TutorPanelComponent],
      providers: [{ provide: TutorService, useValue: { isEnabled: () => of(enabled) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(TutorPanelComponent);
    fixture.componentRef.setInput('label', 'Explícamelo');
    fixture.componentRef.setInput('ask', ask);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  it('says how to turn the tutor on when the server has none', async () => {
    await render(false, () => of(''));

    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('.tutor__off')?.textContent).toContain('ANTHROPIC_API_KEY');
  });

  it('shows the answer', async () => {
    await render(true, () => of('Una **caja** con nombre.'));

    element.querySelector('button')!.click();
    fixture.detectChanges();

    expect(element.querySelector('.tutor__answer')?.textContent).toContain('caja con nombre');
  });

  it('shows why it failed, right there', async () => {
    await render(true, () =>
      throwError(
        () => new AppError(503, 'TUTOR_UNAVAILABLE', 'La clave ANTHROPIC_API_KEY no es válida.'),
      ),
    );

    element.querySelector('button')!.click();
    fixture.detectChanges();

    expect(element.querySelector('.tutor__error')?.textContent).toContain('no es válida');
  });
});
