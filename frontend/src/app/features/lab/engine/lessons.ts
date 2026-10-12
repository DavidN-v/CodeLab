import { DiagnosticLesson } from '../models/lab.models';

/**
 * What to learn from each problem the lab can recognise: why it matters, what
 * it causes, how to fix it, an example and the concept behind it. Keyed by the
 * diagnostic code. Problems without an entry can still be explained by the tutor.
 */
export const LESSONS: Record<string, DiagnosticLesson> = {
  // --- Rules of the lab -----------------------------------------------------
  'forja/var': {
    why: '`var` no respeta los bloques `{ }`: la variable existe en toda la función, incluso antes de la línea donde la declaras.',
    consequence: 'Puedes pisar sin querer una variable con el mismo nombre, o leerla cuando todavía vale `undefined`, sin que nada te avise.',
    fix: 'Usa `const` si el valor no se reasigna y `let` si va a cambiar.',
    example: 'const precio = 20;\nlet total = 0;\ntotal = total + precio;',
    concept: 'Ámbito de las variables (scope) y la diferencia entre var, let y const.',
  },
  'forja/eqeq': {
    why: '`==` convierte los tipos antes de comparar: `"5" == 5` es `true` y `0 == ""` también.',
    consequence: 'Una condición puede cumplirse con valores que no esperabas, por ejemplo un texto vacío tratado como cero.',
    fix: 'Compara con `===` y `!==`, que exigen el mismo tipo y el mismo valor.',
    example: 'if (edad === 18) {\n  console.log("Justo 18");\n}',
    concept: 'Igualdad estricta frente a igualdad con conversión de tipos.',
  },
  'forja/assign-in-condition': {
    why: 'Un solo `=` asigna un valor; no compara. La condición guarda el valor en la variable y después lo evalúa.',
    consequence: 'La condición deja de depender de lo que querías comprobar y, además, cambia la variable.',
    fix: 'Usa `===` para comparar.',
    example: 'if (intentos === 3) {\n  console.log("Último intento");\n}',
    concept: 'Asignación (=) frente a comparación (===).',
  },
  'forja/nan-comparison': {
    why: '`NaN` («no es un número») es el único valor que no es igual a nada, ni siquiera a sí mismo.',
    consequence: 'La comparación da siempre `false` (o siempre `true` con `!==`), así que ese `if` nunca hace lo que esperas.',
    fix: 'Usa `Number.isNaN(valor)` para saber si una cuenta no ha dado un número.',
    example: 'const numero = Number("hola");\nif (Number.isNaN(numero)) {\n  console.log("No es un número");\n}',
    concept: 'El valor NaN y la conversión de texto a número.',
  },
  'forja/unreachable': {
    why: '`return`, `throw`, `break` y `continue` saltan fuera: lo que escribes después, en el mismo bloque, no se ejecuta nunca.',
    consequence: 'Ese código parece hacer algo, pero no hace nada. Suele ser una línea que quedó en el sitio equivocado.',
    fix: 'Mueve esas líneas antes del salto, o bórralas si ya no hacen falta.',
    example: 'function doble(n) {\n  const resultado = n * 2;\n  console.log(resultado);\n  return resultado;\n}',
    concept: 'El flujo de ejecución y qué hace return dentro de una función.',
  },
  'forja/loop-direction': {
    why: 'La condición del bucle espera que la variable avance en un sentido, pero el paso la mueve en el contrario.',
    consequence: 'La variable se aleja del límite en vez de acercarse, y el bucle no termina (o no llega a empezar).',
    fix: 'Haz que el paso acerque la variable al límite: `i++` con `i < n`, o `i--` con `i >= 0`.',
    example: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n}',
    concept: 'Las tres partes de un bucle for: inicio, condición y paso.',
  },
  'forja/endless-loop': {
    why: 'La condición del bucle siempre es verdadera y dentro no hay ningún `break` ni `return` que lo detenga.',
    consequence: 'El bucle no termina. El laboratorio lo corta a los pocos segundos; en una web real, la pestaña se quedaría bloqueada.',
    fix: 'Pon una condición que pueda llegar a ser falsa, o un `break` cuando se cumpla lo que buscas.',
    example: 'let intentos = 0;\nwhile (intentos < 3) {\n  intentos++;\n}',
    concept: 'La condición de salida de un bucle.',
  },
  'forja/empty-catch': {
    why: 'Un `catch` vacío se queda con el error y no hace nada con él.',
    consequence: 'Si algo falla, el programa sigue como si nada y tú no te enteras: es el fallo más difícil de encontrar.',
    fix: 'Como mínimo, muestra el error con `console.error(error)` o avisa a quien usa el programa.',
    example: 'try {\n  guardar(datos);\n} catch (error) {\n  console.error("No se pudo guardar", error);\n}',
    concept: 'Manejo de errores con try y catch.',
  },
  'forja/eval': {
    why: '`eval` y `new Function` ejecutan como código cualquier texto que reciban.',
    consequence: 'Si ese texto viene de una persona o de internet, puede hacer lo que quiera dentro de tu página.',
    fix: 'Casi siempre hay una forma directa: para cuentas, convierte el texto con `Number()` y opera tú.',
    example: 'const a = Number(entradaA.value);\nconst b = Number(entradaB.value);\nconst suma = a + b;',
    concept: 'Seguridad: no ejecutar como código los datos que llegan de fuera.',
  },
  'forja/unsafe-html': {
    why: 'El texto que metes así se interpreta como HTML. Si incluye algo que escribió otra persona, puede contener etiquetas y scripts.',
    consequence: 'Alguien podría inyectar código en tu página (un ataque llamado XSS) y, por ejemplo, robar datos de quien la visita.',
    fix: 'Para mostrar texto usa `textContent`. Para crear elementos, `document.createElement`.',
    example: 'const parrafo = document.createElement("p");\nparrafo.textContent = nombre;\nlista.appendChild(parrafo);',
    concept: 'Seguridad en el DOM: textContent frente a innerHTML.',
  },
  'forja/missing-file': {
    why: 'La página pide un archivo que no está en el proyecto, o lo pide con otro nombre.',
    consequence: 'El navegador no encuentra el archivo: los estilos no se aplican o el código no se ejecuta, sin ningún aviso en la página.',
    fix: 'Comprueba el nombre y la carpeta, con sus mayúsculas, o crea el archivo que falta.',
    example: '<link rel="stylesheet" href="estilos.css">\n<script src="main.js"></script>',
    concept: 'Rutas relativas y cómo una página enlaza sus archivos.',
  },
  'forja/duplicate-id': {
    why: 'Un `id` identifica a un único elemento de la página. Repetirlo rompe esa promesa.',
    consequence: '`document.getElementById` y los selectores `#id` solo encuentran el primero, así que el segundo elemento se queda sin tu código o sin tus estilos.',
    fix: 'Da un `id` distinto a cada elemento, o usa `class` cuando varios comparten estilo o comportamiento.',
    example: '<input id="nombre">\n<input id="apellido">',
    concept: 'Diferencia entre id (único) y class (compartida).',
  },
  'forja/unclosed-tag': {
    why: 'La etiqueta se abre pero no se cierra, o se cierra en otro orden.',
    consequence: 'El navegador intenta adivinar dónde termina y puede meter dentro elementos que no querías: el diseño se descoloca.',
    fix: 'Cierra cada etiqueta en orden inverso a como las abriste. La sangría ayuda a verlo.',
    example: '<ul>\n  <li>Uno</li>\n  <li>Dos</li>\n</ul>',
    concept: 'Estructura de HTML: etiquetas de apertura y cierre, y anidación.',
  },
  'forja/img-alt': {
    why: 'El atributo `alt` describe la imagen para quien no puede verla.',
    consequence: 'Los lectores de pantalla no pueden decir qué muestra la imagen, y si no carga, no aparece nada en su lugar.',
    fix: 'Añade `alt` con una descripción corta. Si la imagen es solo decorativa, déjalo vacío: `alt=""`.',
    example: '<img src="logo.png" alt="Logotipo de la tienda">',
    concept: 'Accesibilidad web.',
  },
  'forja/css-unknown': {
    why: 'El navegador no reconoce esa propiedad o ese valor. Suele ser una errata o una unidad que falta.',
    consequence: 'El navegador ignora esa línea sin avisar, y el estilo no se aplica.',
    fix: 'Revisa cómo se escribe la propiedad y su valor; los tamaños necesitan unidad (`px`, `rem`, `%`).',
    example: '.titulo {\n  color: #e8a23a;\n  margin-top: 16px;\n}',
    concept: 'Sintaxis de CSS: propiedad, valor y unidades.',
  },
  'forja/css-braces': {
    why: 'Las llaves `{ }` de una regla de CSS no están emparejadas.',
    consequence: 'El navegador deja de entender dónde acaba cada regla y puede ignorar todo lo que viene después.',
    fix: 'Cada `{` necesita su `}`. Comprueba la regla anterior a la línea indicada.',
    example: '.caja {\n  padding: 8px;\n}',
    concept: 'Sintaxis de CSS: selector y bloque de declaraciones.',
  },

  // --- Frequent messages of the TypeScript compiler -------------------------
  TS2304: {
    why: 'Usas un nombre que el compilador no encuentra: no está declarado, está mal escrito o está en otro ámbito.',
    consequence: 'Al ejecutarse, esa línea falla con `ReferenceError: ... is not defined` y el programa se detiene ahí.',
    fix: 'Revisa mayúsculas y letras, y declara la variable o la función antes de usarla.',
    example: 'const total = 10;\nconsole.log(total);',
    concept: 'Declaración de variables y ámbito (scope).',
  },
  TS2322: {
    why: 'Intentas guardar un valor de un tipo en un sitio que espera otro, por ejemplo un texto en una variable numérica.',
    consequence: 'Las cuentas y comparaciones posteriores dan resultados raros: `"2" + 3` es `"23"`, no `5`.',
    fix: 'Convierte el valor (`Number(texto)`, `String(numero)`) o cambia el tipo declarado si era ese el error.',
    example: 'const edad: number = Number("18");',
    concept: 'Tipos de datos y conversión entre tipos.',
  },
  TS2345: {
    why: 'Llamas a una función con un argumento de un tipo distinto del que espera.',
    consequence: 'La función trabajaría con un dato que no sabe tratar y daría un resultado incorrecto o un error.',
    fix: 'Mira qué tipo pide cada parámetro y pásale un valor de ese tipo.',
    example: 'function doble(n: number): number {\n  return n * 2;\n}\ndoble(Number("4"));',
    concept: 'Parámetros de una función y sus tipos.',
  },
  TS2339: {
    why: 'Pides una propiedad o un método que ese tipo de valor no tiene.',
    consequence: 'Al ejecutarse obtendrías `undefined` o un error del tipo «no es una función».',
    fix: 'Comprueba el nombre de la propiedad y de qué tipo es realmente el valor.',
    example: 'const nombre = "Ada";\nconsole.log(nombre.length);',
    concept: 'Objetos, propiedades y métodos.',
  },
  TS2554: {
    why: 'Llamas a una función con más o menos argumentos de los que declara.',
    consequence: 'Los parámetros que faltan valen `undefined` y las cuentas con ellos dan `NaN`.',
    fix: 'Pasa un argumento por cada parámetro, en el mismo orden.',
    example: 'function sumar(a: number, b: number): number {\n  return a + b;\n}\nsumar(2, 3);',
    concept: 'Parámetros y argumentos de una función.',
  },
  TS2451: {
    why: 'Declaras dos veces el mismo nombre en el mismo ámbito.',
    consequence: 'El navegador rechaza el archivo entero con un error de sintaxis y no se ejecuta nada.',
    fix: 'Cambia uno de los nombres, o quita el `let`/`const` de la segunda línea si querías reasignar.',
    example: 'let total = 0;\ntotal = 5;',
    concept: 'Declarar frente a reasignar una variable.',
  },
  TS2588: {
    why: 'Intentas cambiar el valor de una constante (`const`).',
    consequence: 'Al ejecutarse, esa línea lanza `TypeError: Assignment to constant variable`.',
    fix: 'Decláralo con `let` si el valor tiene que cambiar.',
    example: 'let contador = 0;\ncontador = contador + 1;',
    concept: 'Diferencia entre let y const.',
  },
  TS7006: {
    why: 'El parámetro no tiene tipo y TypeScript no puede deducirlo, así que lo trataría como «cualquier cosa».',
    consequence: 'El compilador deja de comprobar lo que haces con él y los errores aparecen al ejecutar.',
    fix: 'Escribe el tipo después del nombre del parámetro.',
    example: 'function saludar(nombre: string): string {\n  return "Hola, " + nombre;\n}',
    concept: 'Anotaciones de tipo en TypeScript.',
  },
  TS18047: {
    why: 'El valor puede ser `null`, por ejemplo porque `document.querySelector` no encuentra el elemento.',
    consequence: 'Si de verdad es `null`, esa línea falla con `Cannot read properties of null`.',
    fix: 'Comprueba antes que existe, con un `if`.',
    example: 'const boton = document.querySelector("#enviar");\nif (boton) {\n  boton.addEventListener("click", enviar);\n}',
    concept: 'Valores null y comprobaciones antes de usar un elemento del DOM.',
  },
  TS6133: {
    why: 'Declaras algo que después no usas.',
    consequence: 'No rompe nada, pero confunde a quien lee el código y a veces delata que te olvidaste de usarlo.',
    fix: 'Úsalo donde tocaba o bórralo.',
    example: 'const iva = 0.21;\nconst total = precio * (1 + iva);',
    concept: 'Código limpio: cada declaración tiene un propósito.',
  },
};

// --- Errors raised while the program runs ---------------------------------
LESSONS['runtime/ReferenceError'] = {
  why: 'El programa ha llegado a una línea que usa un nombre que no existe en ese momento: no está declarado, está mal escrito o se usa antes de declararlo.',
  consequence: 'La ejecución se detiene en esa línea; lo que venía después no se ejecuta.',
  fix: 'Compara letra a letra el nombre que usas con el que declaraste, y comprueba que la declaración va antes.',
  example: 'const saludo = "Hola";\nconsole.log(saludo);',
  concept: 'Declaración de variables, orden de ejecución y ámbito (scope).',
};
LESSONS['runtime/TypeError'] = {
  why: 'Se ha intentado usar un valor de una forma que su tipo no permite: llamar a algo que no es una función, o leer una propiedad de `null` o `undefined`.',
  consequence: 'La ejecución se detiene en esa línea. Es el error más habitual cuando `document.querySelector` no encuentra el elemento.',
  fix: 'Muestra el valor con `console.log` justo antes de la línea que falla y comprueba que es lo que esperas.',
  example: 'const boton = document.querySelector("#enviar");\nconsole.log(boton);\nif (boton) {\n  boton.textContent = "Enviar";\n}',
  concept: 'Los valores null y undefined, y cómo depurar con console.log.',
};
LESSONS['runtime/RangeError'] = {
  why: 'Un valor se ha salido de lo permitido. Lo más habitual: una función que se llama a sí misma sin parar hasta agotar la memoria de llamadas.',
  consequence: 'El programa se detiene con «Maximum call stack size exceeded».',
  fix: 'Una función recursiva necesita un caso base: una condición en la que devuelve un valor sin volver a llamarse.',
  example: 'function cuentaAtras(n) {\n  if (n <= 0) {\n    return;\n  }\n  console.log(n);\n  cuentaAtras(n - 1);\n}',
  concept: 'Recursión y caso base.',
};
LESSONS['runtime/loop'] = {
  why: 'El bucle llevaba varios segundos dando vueltas sin llegar a su condición de salida.',
  consequence: 'El laboratorio lo ha detenido. En una web real, la pestaña se quedaría bloqueada.',
  fix: 'Comprueba que dentro del bucle cambia algo que acerca la condición a ser falsa. Un `console.log` del contador dentro del bucle lo deja ver enseguida.',
  example: 'let i = 0;\nwhile (i < 3) {\n  console.log(i);\n  i++;\n}',
  concept: 'La condición de salida de un bucle.',
};

// The same advice applies to the "possibly undefined" variants.
LESSONS['TS2531'] = LESSONS['TS18047'];
LESSONS['TS18048'] = LESSONS['TS18047'];
LESSONS['TS2532'] = LESSONS['TS18047'];
LESSONS['TS2552'] = LESSONS['TS2304'];
LESSONS['TS2551'] = LESSONS['TS2339'];
