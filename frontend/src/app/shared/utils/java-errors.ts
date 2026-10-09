/**
 * Turns compiler and runtime errors into plain Spanish for someone who has
 * never programmed: what happened, where, and what to look at.
 */
export interface FriendlyError {
  /** Short headline, e.g. "Falta un punto y coma". */
  title: string;
  /** What it means, in one or two sentences. */
  explanation: string;
  /** Line of the learner's program, when known. */
  line: number | null;
  /** The original message, for reference. */
  original: string;
}

interface Rule {
  pattern: RegExp;
  title: string | ((match: RegExpMatchArray, detail: string) => string);
  explanation: string | ((match: RegExpMatchArray, detail: string) => string);
}

const COMPILE_RULES: Rule[] = [
  {
    pattern: /';' expected/,
    title: 'Falta un punto y coma',
    explanation:
      'En Java cada instrucción termina en «;». Revisa el final de esta línea; a veces el que falta es el de la línea anterior.',
  },
  {
    pattern: /'\)' expected/,
    title: 'Falta cerrar un paréntesis',
    explanation: 'Cada «(» necesita su «)». Cuenta los paréntesis de la línea.',
  },
  {
    pattern: /'\(' expected/,
    title: 'Falta abrir un paréntesis',
    explanation:
      'Java esperaba un «(», por ejemplo después de if, while, for o del nombre de un método.',
  },
  {
    pattern: /'\]' expected/,
    title: 'Falta cerrar un corchete',
    explanation: 'Cada «[» necesita su «]», como en numeros[0].',
  },
  {
    pattern: /'\{' expected/,
    title: 'Falta abrir una llave',
    explanation:
      'Java esperaba un «{», por ejemplo después de la cabecera de una clase o un método.',
  },
  {
    pattern: /reached end of file while parsing/,
    title: 'Falta cerrar una llave',
    explanation:
      'El archivo terminó antes de cerrar todos los bloques. Cada «{» necesita su «}»: revisa la clase, los métodos, los if y los bucles.',
  },
  {
    pattern: /class, interface, enum, or record expected/,
    title: 'Hay código fuera de la clase',
    explanation:
      'Suele ser una «}» de más que cierra la clase antes de tiempo, o un método escrito fuera de la clase.',
  },
  {
    pattern: /unclosed string literal/,
    title: 'Un texto no está cerrado',
    explanation: 'Un texto empieza con comillas «"» pero no las cierra en la misma línea.',
  },
  {
    pattern: /unclosed character literal|empty character literal/,
    title: 'Un carácter mal escrito',
    explanation:
      'Las comillas simples son para un solo carácter, como \'a\'. Para textos usa comillas dobles: "hola".',
  },
  {
    pattern: /cannot find symbol/,
    title: (_match, detail) => {
      const variable = /symbol:\s+variable (\w+)/.exec(detail);
      if (variable) {
        return `Java no conoce la variable «${variable[1]}»`;
      }
      const method = /symbol:\s+method (\w+)/.exec(detail);
      if (method) {
        return `Java no conoce el método «${method[1]}»`;
      }
      const type = /symbol:\s+class (\w+)/.exec(detail);
      if (type) {
        return `Java no conoce el tipo «${type[1]}»`;
      }
      return 'Java no reconoce un nombre';
    },
    explanation: (_match, detail) => {
      if (/symbol:\s+class/.test(detail)) {
        return '¿Está bien escrito (String, Scanner y System van con mayúscula)? Si es de una librería, ¿falta el import, como import java.util.Scanner;?';
      }
      if (/symbol:\s+method/.test(detail)) {
        return '¿Está bien escrito su nombre, con las mismas mayúsculas? ¿Existe ese método para ese tipo de dato y con esos argumentos?';
      }
      return '¿Está bien escrita, con las mismas mayúsculas y minúsculas? ¿La declaraste antes de usarla y dentro del mismo bloque { }?';
    },
  },
  {
    pattern: /package system does not exist/,
    title: '«System» va con mayúscula',
    explanation:
      'Escribe System.out.println, con la S mayúscula: Java distingue mayúsculas de minúsculas.',
  },
  {
    pattern: /possible lossy conversion from (\w+) to (\w+)/,
    title: (m) => `Un ${m[1]} no cabe en un ${m[2]}`,
    explanation: (m) =>
      `Guardar un ${m[1]} en un ${m[2]} podría perder información (por ejemplo, los decimales). Si es lo que quieres, conviértelo a mano con (${m[2]}); si no, cambia el tipo de la variable.`,
  },
  {
    pattern: /incompatible types: String cannot be converted to (int|double|long)/,
    title: 'Un texto no es un número',
    explanation: (m) =>
      `Para convertir un texto en ${m[1]} usa ${m[1] === 'int' ? 'Integer.parseInt(texto)' : m[1] === 'double' ? 'Double.parseDouble(texto)' : 'Long.parseLong(texto)'}.`,
  },
  {
    pattern: /incompatible types: int cannot be converted to boolean/,
    title: 'Una condición debe ser verdadera o falsa',
    explanation:
      'En una condición, para comparar se usa «==», no «=». «=» guarda un valor; «==» pregunta si son iguales.',
  },
  {
    pattern: /incompatible types: (.+) cannot be converted to (.+)/,
    title: 'Tipos que no encajan',
    explanation: (m) =>
      `Intentas usar un ${m[1].trim()} donde Java espera un ${m[2].trim()}. Revisa el tipo de la variable o lo que devuelve el método.`,
  },
  {
    pattern: /missing return statement/,
    title: 'Falta un return',
    explanation:
      'El método promete devolver un valor, pero hay algún camino (por ejemplo, un else) que termina sin return.',
  },
  {
    pattern: /variable (\w+) might not have been initialized/,
    title: (m) => `«${m[1]}» no tiene valor todavía`,
    explanation: (m) =>
      `Antes de usar «${m[1]}» hay que darle un valor, por ejemplo al declararla: int ${m[1]} = 0;`,
  },
  {
    pattern: /variable (\w+) is already defined/,
    title: (m) => `«${m[1]}» ya existe`,
    explanation: (m) =>
      `Declaraste «${m[1]}» dos veces. Para cambiar su valor no repitas el tipo: escribe ${m[1]} = ... en lugar de int ${m[1]} = ...`,
  },
  {
    pattern: /cannot assign a value to final variable (\w+)/,
    title: (m) => `«${m[1]}» es una constante`,
    explanation: 'Una variable final no puede cambiar de valor después de dársela.',
  },
  {
    pattern:
      /non-static (variable|method) (\w+)(\(.*\))? cannot be referenced from a static context/,
    title: (m) => `«${m[2]}» necesita un objeto`,
    explanation:
      'main es static: no pertenece a ningún objeto. Crea un objeto y úsalo (obj.metodo()), o declara también ese método o atributo como static.',
  },
  {
    pattern: /unreachable statement/,
    title: 'Código que nunca se ejecuta',
    explanation:
      'Esta línea va después de un return, break o continue, así que nunca se llega a ella.',
  },
  {
    pattern: /bad operand types? for (binary|unary) operator '(.+?)'/,
    title: (m) => `«${m[2]}» no sirve para estos tipos`,
    explanation: (m) =>
      m[2] === '&&' || m[2] === '||'
        ? '«&&» y «||» unen condiciones verdaderas o falsas, no números.'
        : `El operador «${m[2]}» no se puede usar con esos datos. Por ejemplo, los textos se comparan con equals, no con < o >.`,
  },
  {
    pattern: /method (\w+) in (class|interface) (\w+) cannot be applied to given types/,
    title: (m) => `Argumentos que no encajan con «${m[1]}»`,
    explanation:
      'Llamas al método con un número o un tipo de argumentos distinto del que pide. Compara la llamada con su declaración.',
  },
  {
    pattern: /constructor (\w+) in class (\w+) cannot be applied to given types/,
    title: (m) => `Argumentos que no encajan con el constructor de «${m[1]}»`,
    explanation:
      'Los datos de new no coinciden con los parámetros del constructor: revisa cuántos son y su tipo.',
  },
  {
    pattern: /'else' without 'if'/,
    title: 'Un else sin su if',
    explanation:
      'Suele ser un «;» justo después del if (...) o una llave «}» que cierra el if antes de tiempo.',
  },
  {
    pattern: /not a statement/,
    title: 'Esto no es una instrucción',
    explanation:
      'Una expresión suelta, como x + 1; no hace nada. ¿Querías guardarla (x = x + 1;) o imprimirla?',
  },
  {
    pattern: /illegal start of (expression|type)/,
    title: 'Algo no está en su sitio',
    explanation:
      'Suele deberse a una llave o un paréntesis mal cerrado en las líneas de antes, o a un método escrito dentro de otro.',
  },
  {
    pattern: /<identifier> expected/,
    title: 'Instrucción fuera de un método',
    explanation:
      'Las instrucciones (println, asignaciones, bucles…) deben ir dentro de un método, como main.',
  },
  {
    pattern: /unreported exception (\w+(?:\.\w+)*); must be caught or declared to be thrown/,
    title: 'Una excepción sin atender',
    explanation: (m) =>
      `Esta operación puede lanzar ${m[1].split('.').pop()}. Rodéala con try { ... } catch, o añade throws a la cabecera del método.`,
  },
  {
    pattern: /invalid method declaration; return type required/,
    title: 'Falta el tipo de retorno',
    explanation:
      'Cada método indica qué devuelve (void si no devuelve nada). Si querías un constructor, su nombre debe ser igual al de la clase.',
  },
  {
    pattern: /(int|double|char|boolean|long) cannot be dereferenced/,
    title: (m) => `Un ${m[1]} no tiene métodos`,
    explanation:
      'Los tipos primitivos (int, double, char…) no tienen métodos con punto. Para textos usa String.',
  },
  {
    pattern: /is not abstract and does not override abstract method (\w+)/,
    title: (m) => `Falta implementar «${m[1]}»`,
    explanation:
      'La clase promete cumplir una interfaz o una clase abstracta: tiene que escribir todos sus métodos.',
  },
  {
    pattern: /(\w+) has private access in (\w+)/,
    title: (m) => `«${m[1]}» es privado`,
    explanation: (m) =>
      `Solo la clase ${m[2]} puede usarlo directamente. Desde fuera, usa un método público (por ejemplo, un getter).`,
  },
  {
    pattern: /class (\w+) is public, should be declared in a file named/,
    title: 'Dos clases públicas',
    explanation: 'Solo puede haber una clase public por archivo. Quita public de las demás.',
  },
  {
    pattern: /array required, but (\w+) found/,
    title: 'Eso no es un array',
    explanation:
      'Los corchetes [ ] solo sirven con arrays. Para un texto usa charAt(i); para una lista, get(i).',
  },
];

interface ExceptionRule {
  type: string;
  title: string;
  explanation: (message: string) => string;
}

const EXCEPTION_RULES: ExceptionRule[] = [
  {
    type: 'ArithmeticException',
    title: 'División entre cero',
    explanation: () =>
      'Dividiste un número entero entre 0, y eso no tiene resultado. Comprueba el divisor antes de dividir.',
  },
  {
    type: 'ArrayIndexOutOfBoundsException',
    title: 'Posición fuera del array',
    explanation: (message) => {
      const match = /Index (-?\d+) out of bounds for length (\d+)/.exec(message);
      return match
        ? `Pediste la posición ${match[1]}, pero el array tiene ${match[2]} elementos: sus posiciones van de 0 a ${Number(match[2]) - 1}. ¿Tu bucle usa <= en vez de <?`
        : 'Pediste una posición que el array no tiene. Las posiciones van de 0 a length - 1.';
    },
  },
  {
    type: 'StringIndexOutOfBoundsException',
    title: 'Posición fuera del texto',
    explanation: () =>
      'Pediste un carácter en una posición que el texto no tiene. Las posiciones van de 0 a length() - 1.',
  },
  {
    type: 'IndexOutOfBoundsException',
    title: 'Posición fuera de la lista',
    explanation: () =>
      'Pediste un elemento en una posición que la lista no tiene. Van de 0 a size() - 1.',
  },
  {
    type: 'NullPointerException',
    title: 'Usaste algo que vale null',
    explanation: () =>
      'Una variable no apunta a ningún objeto (vale null) y le pediste algo con un punto. ¿Olvidaste crearlo con new o darle un valor?',
  },
  {
    type: 'NumberFormatException',
    title: 'Ese texto no es un número',
    explanation: (message) => {
      const match = /For input string: "(.*)"/.exec(message);
      return match
        ? `Intentaste convertir «${match[1]}» en número. ¿Tiene espacios, letras o una coma en vez de un punto?`
        : 'Intentaste convertir en número un texto que no lo es.';
    },
  },
  {
    type: 'InputMismatchException',
    title: 'La entrada no es del tipo esperado',
    explanation: () =>
      'Scanner esperaba un número (nextInt, nextDouble…) pero encontró otra cosa. Revisa la entrada que le das al programa.',
  },
  {
    type: 'NoSuchElementException',
    title: 'Se acabó la entrada',
    explanation: () =>
      'El programa quiso leer más datos de los que había. Escribe la entrada en el cuadro «Entrada», una línea por cada dato que lee.',
  },
  {
    type: 'ClassCastException',
    title: 'Conversión imposible',
    explanation: () =>
      'Intentaste convertir un objeto a un tipo que no es. Compruébalo antes con instanceof.',
  },
  {
    type: 'StackOverflowError',
    title: 'Llamadas sin fin',
    explanation: () =>
      'Un método se llama a sí mismo una y otra vez sin parar. ¿Falta el caso base de la recursión, o no se acerca a él?',
  },
  {
    type: 'OutOfMemoryError',
    title: 'Sin memoria',
    explanation: () =>
      'El programa creó demasiados datos. ¿Hay un bucle que añade elementos sin terminar nunca?',
  },
  {
    type: 'ConcurrentModificationException',
    title: 'La lista cambió mientras la recorrías',
    explanation: () =>
      'No se puede añadir ni quitar elementos de una colección dentro de un for-each que la recorre. Usa removeIf o un Iterator.',
  },
  {
    type: 'UnsupportedOperationException',
    title: 'Esa colección no se puede cambiar',
    explanation: () =>
      'Las listas creadas con List.of(...) son de solo lectura. Si necesitas cambiarla, usa new ArrayList<>(...).',
  },
  {
    type: 'NegativeArraySizeException',
    title: 'Un array de tamaño negativo',
    explanation: () => 'Un array no puede tener un tamaño menor que 0.',
  },
  {
    type: 'IllegalArgumentException',
    title: 'Un dato no válido',
    explanation: (message) =>
      message
        ? `Un método rechazó un dato: «${message}».`
        : 'Un método recibió un dato que no acepta.',
  },
  {
    type: 'IllegalStateException',
    title: 'Operación fuera de lugar',
    explanation: (message) =>
      message
        ? `El objeto no estaba listo para esa operación: «${message}».`
        : 'Se pidió algo que el objeto no puede hacer en su estado actual.',
  },
];

/** Every error in javac's output, in order. */
export function explainCompileErrors(output: string): FriendlyError[] {
  const errors: FriendlyError[] = [];
  const lines = output.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const header = /^(?:.*[\\/])?\w+\.java:(\d+): error: (.*)$/.exec(lines[index]);
    if (!header) {
      continue;
    }
    // javac adds context lines (the code, a caret, "symbol: ...") after the header.
    const detail = lines.slice(index + 1, index + 6).join('\n');
    errors.push(explainMessage(header[2], detail, Number(header[1])));
  }
  return errors;
}

function explainMessage(message: string, detail: string, line: number): FriendlyError {
  for (const rule of COMPILE_RULES) {
    const match = message.match(rule.pattern);
    if (match) {
      return {
        title: typeof rule.title === 'function' ? rule.title(match, detail) : rule.title,
        explanation:
          typeof rule.explanation === 'function'
            ? rule.explanation(match, detail)
            : rule.explanation,
        line,
        original: message,
      };
    }
  }
  return {
    title: 'Error de compilación',
    explanation:
      'Java no entiende algo de esta línea. Mira bien los símbolos: llaves, paréntesis, comillas y punto y coma.',
    line,
    original: message,
  };
}

/** The exception in a stack trace printed to stderr, if there is one. */
export function explainRuntimeError(stderr: string): FriendlyError | null {
  const header =
    /Exception in thread "[^"]*" (?:[\w$]+\.)*([\w$]+(?:Exception|Error))(?::\s*(.*))?/.exec(
      stderr,
    );
  if (!header) {
    return null;
  }
  // The first frame in the learner's code: JDK frames carry a module prefix (java.base/).
  const frame = /\tat (?![\w.]+\/)[\w$.<>]+\((\w+)\.java:(\d+)\)/.exec(stderr);
  return explainException(header[1], header[2] ?? '', frame ? Number(frame[2]) : null);
}

export function explainException(
  type: string,
  message: string | null,
  line: number | null,
): FriendlyError {
  const rule = EXCEPTION_RULES.find((candidate) => candidate.type === type);
  return {
    title: rule?.title ?? `El programa se detuvo con ${type}`,
    explanation:
      rule?.explanation(message ?? '') ??
      'Algo salió mal mientras el programa se ejecutaba. Lee el mensaje y mira la línea indicada.',
    line,
    original: message ? `${type}: ${message}` : type,
  };
}
