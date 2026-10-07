import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionResult } from '../../../../core/models/execution.model';
import { ConsoleOutputComponent } from './console-output.component';

const OK: ExecutionResult = {
  status: 'SUCCESS',
  compileOutput: '',
  stdout: 'Hola\n',
  stderr: '',
  exitCode: 0,
  durationMs: 80,
  outputTruncated: false,
};

describe('ConsoleOutputComponent', () => {
  let fixture: ComponentFixture<ConsoleOutputComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConsoleOutputComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConsoleOutputComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('shows what the program printed', () => {
    fixture.componentRef.setInput('result', OK);
    fixture.detectChanges();

    expect(element.querySelector('.console__stream')?.textContent).toBe('Hola\n');
    expect(element.querySelector('.console__status')?.textContent).toContain('Ejecutado');
  });

  it('marks compiler errors and explains timeouts', () => {
    fixture.componentRef.setInput('result', {
      ...OK,
      status: 'COMPILATION_ERROR',
      compileOutput: "Main.java:3: error: ';' expected",
      stdout: '',
      exitCode: null,
    });
    fixture.detectChanges();
    expect(element.querySelector('.console__stream--error')?.textContent).toContain("';' expected");

    fixture.componentRef.setInput('result', {
      ...OK,
      status: 'TIMEOUT',
      stdout: '',
      exitCode: 137,
    });
    fixture.detectChanges();
    expect(element.textContent).toContain('superó el tiempo máximo');
  });
});
