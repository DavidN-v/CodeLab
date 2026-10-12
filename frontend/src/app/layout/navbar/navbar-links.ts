export interface NavLink {
  label: string;
  path: string;
  /** A short symbol shown before the label. */
  icon?: string;
}

/** Primary navigation, in display order. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Mi panel', path: '/dashboard' },
  { label: 'Cursos', path: '/languages' },
  // The visualizer and the playground live inside Práctica.
  { label: 'Práctica', path: '/practice' },
  // The lab: build anything with HTML, CSS, JavaScript and TypeScript.
  { label: 'Práctica general', path: '/lab', icon: '</>' },
];
