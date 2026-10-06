export type TokenKind = 'keyword' | 'type' | 'string' | 'plain';

export interface CodeToken {
  text: string;
  kind: TokenKind;
}

export type CodeLine = readonly CodeToken[];

const keyword = (text: string): CodeToken => ({ text, kind: 'keyword' });
const type = (text: string): CodeToken => ({ text, kind: 'type' });
const string = (text: string): CodeToken => ({ text, kind: 'string' });
const plain = (text: string): CodeToken => ({ text, kind: 'plain' });

/**
 * Static illustration for the landing page, tokenised by hand. The real editor
 * (Monaco) does its own highlighting; this only has to look like code.
 */
export const SAMPLE_FILE_NAME = 'Main.java';

export const SAMPLE_SOURCE: readonly CodeLine[] = [
  [keyword('public class'), plain(' '), type('Main'), plain(' {')],
  [
    plain('    '),
    keyword('public static void'),
    plain(' main('),
    type('String'),
    plain('[] args) {'),
  ],
  [plain('        '), type('String'), plain(' lenguaje = '), string('"Java"'), plain(';')],
  [
    plain('        '),
    type('System'),
    plain('.out.println('),
    string('"Hola, "'),
    plain(' + lenguaje);'),
  ],
  [plain('    }')],
  [plain('}')],
];

export const SAMPLE_COMMAND = 'java Main.java';

export const SAMPLE_OUTPUT: readonly string[] = ['Hola, Java'];
