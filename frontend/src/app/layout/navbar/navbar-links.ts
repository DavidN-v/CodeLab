export interface NavLink {
  label: string;
  path: string;
}

/** Primary navigation, in display order. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Lenguajes', path: '/languages' },
  { label: 'Práctica', path: '/practice' },
  { label: 'Visualizador', path: '/practice/visualizer' },
  { label: 'Panel', path: '/dashboard' },
];
