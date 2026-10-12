import {
  Completion,
  CompletionContext,
  CompletionResult,
  snippetCompletion,
} from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

const KEYWORDS =
  'abstract boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long new package private protected public record return short static super switch this throw throws try var void while true false null'.split(
    ' ',
  );

const TYPES =
  'String Integer Double Boolean Character Long Object Math System Scanner ArrayList List HashMap Map HashSet Set Arrays Random StringBuilder Optional Exception RuntimeException IllegalArgumentException LocalDate'.split(
    ' ',
  );

/** Members beginners reach for, offered after a dot. */
const MEMBERS =
  'length() charAt() equals() equalsIgnoreCase() isEmpty() contains() indexOf() substring() toUpperCase() toLowerCase() trim() split() size() add() get() set() remove() put() containsKey() keySet() values() nextInt() nextLine() nextDouble() hasNextLine() hasNextInt() println() print() printf() parseInt() parseDouble() valueOf() toString() append() length out in sqrt() pow() abs() max() min() random() round()'.split(
    ' ',
  );

const SNIPPETS: Completion[] = [
  snippetCompletion('System.out.println(${});', { label: 'sout', detail: 'System.out.println', type: 'keyword', boost: 5 }),
  snippetCompletion('public static void main(String[] args) {\n\t${}\n}', { label: 'main', detail: 'método main', type: 'keyword', boost: 4 }),
  snippetCompletion('public class ${Nombre} {\n\t${}\n}', { label: 'class', detail: 'clase', type: 'keyword' }),
  snippetCompletion('for (int ${i} = 0; ${i} < ${limite}; ${i}++) {\n\t${}\n}', { label: 'fori', detail: 'bucle for con índice', type: 'keyword', boost: 3 }),
  snippetCompletion('for (${Tipo} ${elemento} : ${lista}) {\n\t${}\n}', { label: 'foreach', detail: 'recorrer una colección', type: 'keyword' }),
  snippetCompletion('while (${condicion}) {\n\t${}\n}', { label: 'while', detail: 'bucle while', type: 'keyword' }),
  snippetCompletion('if (${condicion}) {\n\t${}\n}', { label: 'if', detail: 'condición', type: 'keyword' }),
  snippetCompletion('if (${condicion}) {\n\t${}\n} else {\n\t${}\n}', { label: 'ifelse', detail: 'condición con else', type: 'keyword' }),
  snippetCompletion('try {\n\t${}\n} catch (${Exception} ${e}) {\n\t${}\n}', { label: 'try', detail: 'try / catch', type: 'keyword' }),
  snippetCompletion('Scanner ${entrada} = new Scanner(System.in);', { label: 'scanner', detail: 'leer del teclado', type: 'keyword' }),
  snippetCompletion('public static ${void} ${nombre}(${}) {\n\t${}\n}', { label: 'psm', detail: 'método estático', type: 'keyword' }),
];

const WORD = /[A-Za-z_$][\w$]*/g;

/**
 * Completion for Java without a language server: snippets, keywords, common
 * types and the names already written in the file.
 */
export function javaCompletions(context: CompletionContext): CompletionResult | null {
  const node = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (/Comment|String|CharacterLiteral/.test(node.name)) {
    return null;
  }
  const word = context.matchBefore(/[A-Za-z_$][\w$]*/);
  const afterDot = context.state.sliceDoc(Math.max(0, (word?.from ?? context.pos) - 1), word?.from ?? context.pos) === '.';
  if (!word && !afterDot && !context.explicit) {
    return null;
  }
  const from = word?.from ?? context.pos;

  // Names declared anywhere in the file: variables, methods and classes.
  const seen = new Set<string>();
  const doc = context.state.doc.toString();
  for (const match of doc.matchAll(WORD)) {
    // The word being typed is not a suggestion for itself.
    if (match.index !== from && match[0].length > 1) {
      seen.add(match[0]);
    }
  }

  const options: Completion[] = [];
  const add = (label: string, type: string, boost = 0): void => {
    options.push({ label, type, boost });
    seen.delete(label.replace(/\(\)$/, ''));
  };
  if (afterDot) {
    MEMBERS.forEach((member) =>
      options.push(
        member.endsWith('()')
          ? snippetCompletion(`${member.slice(0, -2)}(\${})`, { label: member, type: 'method' })
          : { label: member, type: 'property' },
      ),
    );
    MEMBERS.forEach((member) => seen.delete(member.replace(/\(\)$/, '')));
  } else {
    options.push(...SNIPPETS);
    KEYWORDS.forEach((keyword) => add(keyword, 'keyword'));
    TYPES.forEach((type) => add(type, 'class', 1));
  }
  seen.forEach((name) => options.push({ label: name, type: /^[A-Z]/.test(name) ? 'class' : 'variable', boost: 2 }));

  return { from, options, validFor: /^[\w$]*$/ };
}
