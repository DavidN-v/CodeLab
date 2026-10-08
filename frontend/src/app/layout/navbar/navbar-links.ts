export interface NavLink {
  label: string;
  path: string;
}

/** Primary navigation, in display order. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Mi panel', path: '/dashboard' },
  { label: 'Cursos', path: '/languages' },
  // The visualizer and the playground live inside Práctica.
  { label: 'Práctica', path: '/practice' },
];
