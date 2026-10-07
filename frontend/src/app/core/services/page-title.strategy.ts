import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { BRAND } from '../config/brand.config';

/** Appends the product name to every route title: "Lenguajes · Forja". */
@Injectable()
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      routeTitle ? `${routeTitle} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`,
    );
  }
}
