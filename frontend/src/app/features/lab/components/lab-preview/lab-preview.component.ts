import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';

import { LabRunnerService } from '../../services/lab-runner.service';

/**
 * The page the project produces, in a sandboxed frame: it has an origin of its
 * own, so the code in it cannot read the platform's session or call its API.
 */
@Component({
  selector: 'app-lab-preview',
  template: `
    <div class="preview">
      <div class="preview__frame" #frame [class.preview__frame--hidden]="!runner.hasPage()"></div>
      @if (!runner.hasPage()) {
        <div class="preview__empty">
          @if (runner.status() === 'idle' || runner.status() === 'blocked') {
            <p><strong>Aquí se verá tu página.</strong></p>
            <p>Pulsa Ejecutar para cargarla. La vista previa muestra el archivo <code>index.html</code> del proyecto.</p>
          } @else {
            <p><strong>Este proyecto no tiene página.</strong></p>
            <p>
              Solo tiene código, así que su resultado está en la Consola. Si quieres una vista previa, crea un archivo
              <code>index.html</code> y enlaza tu script con <code>&lt;script src="main.js"&gt;&lt;/script&gt;</code>.
            </p>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './lab-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabPreviewComponent {
  protected readonly runner = inject(LabRunnerService);
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');

  constructor() {
    afterNextRender(() => this.runner.attach(this.frame().nativeElement));
    inject(DestroyRef).onDestroy(() => this.runner.attach(null));
  }
}
