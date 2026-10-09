import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { CodeHandoffService } from '../../../../core/services/code-handoff.service';
import { ExecutionService } from '../../../../core/services/execution.service';
import { PLAYGROUND_TEMPLATE, PlaygroundPageComponent } from './playground-page.component';

describe('PlaygroundPageComponent', () => {
  let fixture: ComponentFixture<PlaygroundPageComponent>;
  let element: HTMLElement;
  let run: ReturnType<typeof vi.fn>;
  let authenticated: boolean;

  async function render(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [PlaygroundPageComponent],
      providers: [
        provideRouter([]),
        { provide: ExecutionService, useValue: { run } },
        { provide: AuthService, useValue: { isAuthenticated: () => authenticated } },
      ],
    }).compileComponents();
  }

  function create(): void {
    fixture = TestBed.createComponent(PlaygroundPageComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    localStorage.clear();
    authenticated = true;
    run = vi.fn().mockReturnValue(
      of({
        status: 'SUCCESS',
        compileOutput: '',
        stdout: 'Hola\n',
        stderr: '',
        exitCode: 0,
        durationMs: 50,
        outputTruncated: false,
      }),
    );
  });

  it('starts from the template and runs the code with the given input', async () => {
    await render();
    create();
    const stdin = element.querySelector<HTMLTextAreaElement>('#playground-stdin')!;
    stdin.value = 'Ada';
    stdin.dispatchEvent(new Event('input'));

    element.querySelector<HTMLButtonElement>('.workbench__actions .button--primary')!.click();
    fixture.detectChanges();

    expect(run).toHaveBeenCalledWith(PLAYGROUND_TEMPLATE, 'Ada');
    expect(element.querySelector('.console__stream')?.textContent).toBe('Hola\n');
  });

  it('opens with a snippet sent from a lesson', async () => {
    await render();
    TestBed.inject(CodeHandoffService).send('class Ejemplo {}');
    create();

    element.querySelector<HTMLButtonElement>('.workbench__actions .button--primary')!.click();

    expect(run).toHaveBeenCalledWith('class Ejemplo {}', '');
  });

  it('asks visitors to sign in before running', async () => {
    authenticated = false;
    await render();
    create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    element.querySelector<HTMLButtonElement>('.workbench__actions .button--primary')!.click();

    expect(run).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/practice/playground' },
    });
  });
});
