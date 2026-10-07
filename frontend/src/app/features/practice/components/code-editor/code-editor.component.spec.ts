import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CodeEditorComponent } from './code-editor.component';

@Component({
  imports: [CodeEditorComponent],
  template: '<app-code-editor [(value)]="code" (run)="runs = runs + 1" />',
})
class HostComponent {
  readonly code = signal('class A {}');
  runs = 0;
}

describe('CodeEditorComponent', () => {
  it('stays editable before CodeMirror loads and asks to run on Ctrl+Enter', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    // CodeMirror is imported asynchronously, so the fallback is what renders first.
    const textarea = (fixture.nativeElement as HTMLElement).querySelector('textarea')!;

    expect(textarea.value).toBe('class A {}');
    textarea.value = 'class B {}';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));

    expect(fixture.componentInstance.code()).toBe('class B {}');
    expect(fixture.componentInstance.runs).toBe(1);
  });
});
