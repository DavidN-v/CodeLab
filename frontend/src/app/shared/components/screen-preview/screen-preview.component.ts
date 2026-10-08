import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Plain, readable defaults so the preview looks like an unstyled Angular app. */
const PAGE_STYLES = `
  body { margin: 0; padding: 16px 20px; font: 15px/1.5 system-ui, sans-serif; color: #1f2328; background: #fff; }
  h1 { font-size: 1.6em; margin: 0 0 .5em; } h2 { font-size: 1.25em; margin: .8em 0 .4em; }
  p { margin: .4em 0; } ul, ol { margin: .4em 0; padding-left: 1.4em; }
  button { font: inherit; padding: 4px 12px; border: 1px solid #8c959f; border-radius: 6px; background: #f6f8fa; }
  input, select, textarea { font: inherit; padding: 4px 8px; border: 1px solid #8c959f; border-radius: 6px; }
  label { display: inline-block; margin: 4px 8px 4px 0; } a { color: #0969da; }
  table { border-collapse: collapse; } td, th { border: 1px solid #d0d7de; padding: 4px 8px; }
  .error, .invalid { color: #cf222e; } .ok, .valid { color: #1a7f37; }
  nav a { margin-right: 12px; } .active { font-weight: 700; }
`;

/**
 * What the browser shows: the lesson's static HTML inside a browser window.
 * The page runs in a sandboxed frame without scripts, so it cannot affect
 * the lesson; same-origin only lets the frame be measured to fit its content.
 */
@Component({
  selector: 'app-screen-preview',
  template: `
    <figure class="screen">
      <div class="screen__bar" aria-hidden="true">
        <span class="screen__dots"><i></i><i></i><i></i></span>
        <span class="screen__url">{{ url() }}</span>
      </div>
      <iframe
        #frame
        class="screen__page"
        title="Lo que se ve en el navegador"
        sandbox="allow-same-origin"
        [srcdoc]="document()"
        [style.height.px]="height()"
        (load)="fit()"
      ></iframe>
      <figcaption class="visually-hidden">Vista del navegador en {{ url() }}</figcaption>
    </figure>
  `,
  styleUrl: './screen-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenPreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** First-party HTML from the lesson; scripts never run in the sandbox. */
  readonly html = input.required<string>();
  readonly url = input('localhost:4200');

  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');
  protected readonly height = signal(120);

  protected readonly document = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${PAGE_STYLES}</style></head><body>${this.html()}</body></html>`,
    ),
  );

  protected fit(): void {
    const body = this.frame()?.nativeElement.contentDocument?.body;
    if (body) {
      this.height.set(Math.min(Math.max(body.scrollHeight + 4, 60), 640));
    }
  }
}
