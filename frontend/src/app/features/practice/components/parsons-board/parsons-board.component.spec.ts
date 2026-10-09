import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParsonsBoardComponent } from './parsons-board.component';

describe('ParsonsBoardComponent', () => {
  let fixture: ComponentFixture<ParsonsBoardComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ParsonsBoardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ParsonsBoardComponent);
    fixture.componentRef.setInput('template', 'class Main {\n{{lines}}\n}');
    fixture.componentRef.setInput('pool', ['  b();', '  a();', '  sobra();']);
    fixture.componentRef.setInput('chosen', []);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  function picks(): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('.parsons__pick'));
  }

  it('moves lines into the program and reorders them', () => {
    picks()[1].click();
    fixture.detectChanges();
    picks()[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.chosen()).toEqual([1, 0]);
    expect(picks()).toHaveLength(1);

    element.querySelector<HTMLButtonElement>('[aria-label="Bajar"]')!.click();
    expect(fixture.componentInstance.chosen()).toEqual([0, 1]);
  });

  it('shows the fixed skeleton around the program', () => {
    expect(element.querySelector('.parsons__fixed')?.textContent).toBe('class Main {');
  });
});
