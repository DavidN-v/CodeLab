import { groupLanguages } from './language-groups';
import { Language } from './language.model';

const language = (slug: string, category: Language['category']): Language => ({
  id: slug.length,
  slug,
  name: slug,
  version: null,
  icon: null,
  tagline: '',
  description: null,
  active: true,
  category,
  runnable: slug === 'java',
});

describe('groupLanguages', () => {
  it('puts languages before frameworks and drops empty groups', () => {
    const groups = groupLanguages([language('angular', 'FRAMEWORK'), language('java', 'LANGUAGE')]);

    expect(groups.map((group) => group.title)).toEqual(['Lenguajes de programación', 'Frameworks']);
    expect(groups[1].languages.map((l) => l.slug)).toEqual(['angular']);
    expect(groupLanguages([language('java', 'LANGUAGE')])).toHaveLength(1);
  });
});
