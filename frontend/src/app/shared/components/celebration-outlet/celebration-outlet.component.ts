import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  untracked,
  viewChild,
} from '@angular/core';

import { CelebrationService } from '../../../core/services/celebration.service';

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
}

const COLORS = ['#e8a23a', '#f2b657', '#8fcf8a', '#ec7b66', '#7ab8e8', '#e3c25b'];
const PIECES = 140;
const DURATION_MS = 2600;

/** Confetti over the whole page, and the milestone card. */
@Component({
  selector: 'app-celebration-outlet',
  templateUrl: './celebration-outlet.component.html',
  styleUrl: './celebration-outlet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CelebrationOutletComponent {
  protected readonly celebrations = inject(CelebrationService);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      if (this.celebrations.bursts() > 0) {
        untracked(() => this.burst());
      }
    });
  }

  private burst(): void {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const canvas = this.canvas().nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    canvas.width = globalThis.innerWidth;
    canvas.height = globalThis.innerHeight;
    const pieces: Piece[] = Array.from({ length: PIECES }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 4,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (elapsed > DURATION_MS) {
        return;
      }
      context.globalAlpha = Math.min(1, (DURATION_MS - elapsed) / 600);
      for (const piece of pieces) {
        piece.vy += 0.35;
        piece.vx *= 0.99;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
        context.restore();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
