/** A language or technology offered by the platform. Mirrors the API's Language schema. */
export interface Language {
  id: number;
  slug: string;
  name: string;
  version: string | null;
  icon: string | null;
  tagline: string;
  description: string | null;
  /** False while the language is announced but has no content yet. */
  active: boolean;
  /** A programming language, or a framework built on one (Angular). */
  category: 'LANGUAGE' | 'FRAMEWORK';
  /** Whether learners' code runs in the sandbox (Java); otherwise exercises are graded by comparison. */
  runnable: boolean;
}
