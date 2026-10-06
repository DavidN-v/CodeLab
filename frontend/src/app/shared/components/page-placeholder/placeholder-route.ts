import { Route } from '@angular/router';

export interface PlaceholderRouteConfig {
  path: string;
  /** Used both as the browser title and as the page heading. */
  heading: string;
  description: string;
  /** Roadmap phase in which the real page is delivered. */
  phase: number;
}

/**
 * Route for a page that is planned but not built yet. Replace the call with
 * the real route once the feature exists; the path stays the same.
 */
export function placeholderRoute(config: PlaceholderRouteConfig): Route {
  return {
    path: config.path,
    title: config.heading,
    data: { heading: config.heading, description: config.description, phase: config.phase },
    loadComponent: () =>
      import('./page-placeholder.component').then((m) => m.PagePlaceholderComponent),
  };
}
