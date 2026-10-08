import { Language } from './language.model';

export interface LanguageGroup {
  title: string;
  languages: Language[];
}

/** The catalog in two shelves: programming languages first, then frameworks. Empty shelves are left out. */
export function groupLanguages(languages: readonly Language[]): LanguageGroup[] {
  return [
    {
      title: 'Lenguajes de programación',
      languages: languages.filter((language) => language.category !== 'FRAMEWORK'),
    },
    {
      title: 'Frameworks',
      languages: languages.filter((language) => language.category === 'FRAMEWORK'),
    },
  ].filter((group) => group.languages.length > 0);
}
