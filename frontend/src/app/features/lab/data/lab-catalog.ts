import { LabFile, LabMode, LabTest } from '../models/lab.models';

/** A starting point: either an empty canvas or an exercise with its own tests. */
export interface CatalogEntry {
  id: string;
  mode: LabMode;
  title: string;
  summary: string;
  /** What the learner has to achieve, in Markdown. */
  statement: string;
  files: LabFile[];
  tests: Omit<LabTest, 'id' | 'origin'>[];
}

const PAGE = (title: string, body: string, script = 'main.js'): string => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <link rel="stylesheet" href="estilos.css">
  </head>
  <body>
${body}
    <script src="${script}"></script>
  </body>
</html>
`;

const BASE_STYLES = `body {
  font-family: system-ui, sans-serif;
  max-width: 32rem;
  margin: 2rem auto;
  padding: 0 1rem;
  line-height: 1.5;
}

button {
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}
`;

/** Blank canvases for free practice. */
export const TEMPLATES: CatalogEntry[] = [
  {
    id: 'plantilla-web',
    mode: 'free',
    title: 'Página web',
    summary: 'HTML, CSS y JavaScript enlazados, con vista previa.',
    statement: '',
    files: [
      {
        path: 'index.html',
        content: PAGE(
          'Mi proyecto',
          '    <h1>Mi proyecto</h1>\n    <p id="mensaje">Escribe tu código en main.js y pulsa Ejecutar.</p>\n    <button id="boton">Púlsame</button>',
        ),
      },
      { path: 'estilos.css', content: BASE_STYLES },
      {
        path: 'main.js',
        content: `const boton = document.querySelector('#boton');
const mensaje = document.querySelector('#mensaje');
let pulsaciones = 0;

boton.addEventListener('click', () => {
  pulsaciones++;
  mensaje.textContent = 'Has pulsado ' + pulsaciones + ' veces';
  console.log('Pulsaciones:', pulsaciones);
});
`,
      },
    ],
    tests: [],
  },
  {
    id: 'plantilla-javascript',
    mode: 'free',
    title: 'Solo JavaScript',
    summary: 'Un archivo y la consola: para probar ideas y algoritmos.',
    statement: '',
    files: [
      {
        path: 'main.js',
        content: `function saludar(nombre) {
  return 'Hola, ' + nombre;
}

console.log(saludar('mundo'));
`,
      },
    ],
    tests: [],
  },
  {
    id: 'plantilla-typescript',
    mode: 'free',
    title: 'Solo TypeScript',
    summary: 'Como JavaScript, con tipos que el compilador comprueba.',
    statement: '',
    files: [
      {
        path: 'main.ts',
        content: `interface Producto {
  nombre: string;
  precio: number;
}

function total(productos: Producto[]): number {
  let suma = 0;
  for (const producto of productos) {
    suma += producto.precio;
  }
  return suma;
}

const carrito: Producto[] = [
  { nombre: 'Teclado', precio: 30 },
  { nombre: 'Ratón', precio: 15 },
];

console.log('Total:', total(carrito));
`,
      },
    ],
    tests: [],
  },
];

/** Goals with tests: the learner writes the solution. */
export const CHALLENGES: CatalogEntry[] = [
  {
    id: 'reto-calculadora',
    mode: 'challenge',
    title: 'Calculadora',
    summary: 'Cuatro operaciones y una decisión sobre la división entre cero.',
    statement: `Escribe en \`main.js\` cuatro funciones: \`sumar\`, \`restar\`, \`multiplicar\` y \`dividir\`. Cada una recibe dos números y devuelve el resultado.

**Dividir entre cero** no da un número útil. Decide tú el comportamiento: en este reto, \`dividir(a, 0)\` debe devolver el texto \`"No se puede dividir entre cero"\`.

Puedes escribirlas como quieras: las pruebas solo miran lo que devuelven.`,
    files: [
      {
        path: 'main.js',
        content: `function sumar(a, b) {
  // Devuelve la suma de a y b
}

function restar(a, b) {
}

function multiplicar(a, b) {
}

function dividir(a, b) {
}

console.log('2 + 3 =', sumar(2, 3));
`,
      },
    ],
    tests: [
      { description: '2 + 3 da 5', expression: 'sumar(2, 3)', expected: '5' },
      { description: '10 - 4 da 6', expression: 'restar(10, 4)', expected: '6' },
      { description: '3 × 4 da 12', expression: 'multiplicar(3, 4)', expected: '12' },
      { description: '20 ÷ 5 da 4', expression: 'dividir(20, 5)', expected: '4' },
      { description: 'Suma con decimales', expression: 'sumar(0.5, 0.25)', expected: '0.75' },
      { description: 'Resta que da negativo', expression: 'restar(3, 8)', expected: '-5' },
      {
        description: 'Dividir entre cero avisa',
        expression: 'dividir(7, 0)',
        expected: '"No se puede dividir entre cero"',
      },
    ],
  },
  {
    id: 'reto-lista-de-tareas',
    mode: 'challenge',
    title: 'Lista de tareas',
    summary: 'Guardar, completar y contar tareas con un array de objetos.',
    statement: `Guarda las tareas en el array \`tareas\`. Cada tarea es un objeto \`{ texto, hecha }\`.

Completa tres funciones en \`main.js\`:

- \`agregarTarea(texto)\` añade una tarea **sin hacer**. Si el texto está vacío o solo tiene espacios, no añade nada.
- \`completarTarea(indice)\` marca como hecha la tarea de esa posición. Si la posición no existe, no hace nada.
- \`pendientes()\` devuelve cuántas tareas quedan sin hacer.

La página ya llama a tus funciones: cuando pasen las pruebas, la lista funcionará en la vista previa.`,
    files: [
      {
        path: 'index.html',
        content: PAGE(
          'Lista de tareas',
          '    <h1>Tareas</h1>\n    <form id="formulario">\n      <input id="texto" placeholder="Nueva tarea" aria-label="Nueva tarea">\n      <button>Añadir</button>\n    </form>\n    <ul id="lista"></ul>\n    <p id="resumen"></p>',
        ),
      },
      { path: 'estilos.css', content: `${BASE_STYLES}\n.hecha {\n  text-decoration: line-through;\n  color: gray;\n}\n` },
      {
        path: 'main.js',
        content: `const tareas = [];

function agregarTarea(texto) {
}

function completarTarea(indice) {
}

function pendientes() {
}

// --- La página: no hace falta cambiar nada de aquí abajo ---
const formulario = document.querySelector('#formulario');
const entrada = document.querySelector('#texto');
const lista = document.querySelector('#lista');
const resumen = document.querySelector('#resumen');

function pintar() {
  lista.textContent = '';
  tareas.forEach((tarea, indice) => {
    const elemento = document.createElement('li');
    elemento.textContent = tarea.texto;
    if (tarea.hecha) {
      elemento.className = 'hecha';
    }
    elemento.addEventListener('click', () => {
      completarTarea(indice);
      pintar();
    });
    lista.appendChild(elemento);
  });
  resumen.textContent = 'Pendientes: ' + pendientes();
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  agregarTarea(entrada.value);
  entrada.value = '';
  pintar();
});

pintar();
`,
      },
    ],
    tests: [
      { description: 'Al empezar no hay pendientes', expression: 'tareas.length = 0, pendientes()', expected: '0' },
      {
        description: 'Añadir crea una tarea sin hacer',
        expression: 'tareas.length = 0, agregarTarea("Comprar pan"), tareas',
        expected: '[{ texto: "Comprar pan", hecha: false }]',
      },
      {
        description: 'No se añaden tareas vacías',
        expression: 'tareas.length = 0, agregarTarea("   "), tareas.length',
        expected: '0',
      },
      {
        description: 'Completar marca la tarea',
        expression: 'tareas.length = 0, agregarTarea("A"), agregarTarea("B"), completarTarea(1), tareas[1].hecha',
        expected: 'true',
      },
      {
        description: 'Pendientes cuenta solo las que faltan',
        expression: 'tareas.length = 0, agregarTarea("A"), agregarTarea("B"), completarTarea(0), pendientes()',
        expected: '1',
      },
      {
        description: 'Completar una posición que no existe no rompe nada',
        expression: 'tareas.length = 0, agregarTarea("A"), completarTarea(5), pendientes()',
        expected: '1',
      },
    ],
  },
  {
    id: 'reto-validar-registro',
    mode: 'challenge',
    title: 'Validar un registro',
    summary: 'Comprobar un nombre, un correo y una contraseña antes de aceptarlos.',
    statement: `Escribe en \`main.ts\` la función \`validar(datos)\`, que recibe \`{ nombre, correo, clave }\` y devuelve un **array con los mensajes de error**. Si todo está bien, devuelve un array vacío.

Reglas, en este orden:

1. El nombre no puede estar vacío → \`"El nombre es obligatorio"\`
2. El correo debe contener una \`@\` → \`"El correo no es válido"\`
3. La clave debe tener al menos 8 caracteres → \`"La clave es demasiado corta"\``,
    files: [
      {
        path: 'main.ts',
        content: `interface Registro {
  nombre: string;
  correo: string;
  clave: string;
}

function validar(datos: Registro): string[] {
  const errores: string[] = [];

  return errores;
}

console.log(validar({ nombre: '', correo: 'ada', clave: '123' }));
`,
      },
    ],
    tests: [
      {
        description: 'Datos correctos: sin errores',
        expression: 'validar({ nombre: "Ada", correo: "ada@forja.dev", clave: "12345678" })',
        expected: '[]',
      },
      {
        description: 'Nombre vacío',
        expression: 'validar({ nombre: "", correo: "ada@forja.dev", clave: "12345678" })',
        expected: '["El nombre es obligatorio"]',
      },
      {
        description: 'Correo sin arroba',
        expression: 'validar({ nombre: "Ada", correo: "ada.forja.dev", clave: "12345678" })',
        expected: '["El correo no es válido"]',
      },
      {
        description: 'Clave de 7 caracteres',
        expression: 'validar({ nombre: "Ada", correo: "ada@forja.dev", clave: "1234567" })',
        expected: '["La clave es demasiado corta"]',
      },
      {
        description: 'Todo mal: los tres mensajes, en orden',
        expression: 'validar({ nombre: "", correo: "", clave: "" })',
        expected: '["El nombre es obligatorio", "El correo no es válido", "La clave es demasiado corta"]',
      },
    ],
  },
];

/** Programs with bugs: the learner finds and fixes them. */
export const DEBUG_EXERCISES: CatalogEntry[] = [
  {
    id: 'depura-promedio',
    mode: 'debug',
    title: 'El promedio que no cuadra',
    summary: 'El programa se ejecuta sin errores, pero el resultado es incorrecto.',
    statement: `\`promedio(notas)\` debería devolver la media de un array de números, y \`0\` si el array está vacío.

Se ejecuta sin ningún error, pero los resultados no cuadran. Ejecuta las pruebas, mira qué esperaban y qué han obtenido, y encuentra los **dos** fallos.`,
    files: [
      {
        path: 'main.js',
        content: `function promedio(notas) {
  let suma = 0;
  for (let i = 1; i < notas.length; i++) {
    suma += notas[i];
  }
  return suma / notas.length;
}

console.log('Promedio de 6, 8 y 10:', promedio([6, 8, 10]));
`,
      },
    ],
    tests: [
      { description: 'Media de 6, 8 y 10', expression: 'promedio([6, 8, 10])', expected: '8' },
      { description: 'Media de un solo número', expression: 'promedio([7])', expected: '7' },
      { description: 'Sin notas, la media es 0', expression: 'promedio([])', expected: '0' },
    ],
  },
  {
    id: 'depura-contador',
    mode: 'debug',
    title: 'El contador que no cuenta',
    summary: 'Una página con un botón que no hace lo que debería.',
    statement: `La página tiene un contador con dos botones. Debería sumar 1 con **+**, restar 1 con **−** y no bajar nunca de 0.

Ahora mismo ni siquiera arranca. Ejecuta, lee el error de la consola y la pestaña **Problemas**, y arregla los fallos uno a uno: hay **tres**.`,
    files: [
      {
        path: 'index.html',
        content: PAGE(
          'Contador',
          '    <h1>Contador</h1>\n    <p id="valor">0</p>\n    <button id="menos">−</button>\n    <button id="mas">+</button>',
        ),
      },
      { path: 'estilos.css', content: `${BASE_STYLES}\n#valor {\n  font-size: 3rem;\n  margin: 0.5rem 0;\n}\n` },
      {
        path: 'main.js',
        content: `let contador = 0;
const valor = document.querySelector('#valor');
const mas = document.querySelector('#sumar');
const menos = document.querySelector('#menos');

function pintar() {
  valor.textContent = contador;
}

function incrementar() {
  contador + 1;
  pintar();
}

function decrementar() {
  if (contador = 0) {
    return;
  }
  contador--;
  pintar();
}

mas.addEventListener('click', incrementar);
menos.addEventListener('click', decrementar);
`,
      },
    ],
    tests: [
      { description: 'Sumar una vez da 1', expression: 'contador = 0, incrementar(), contador', expected: '1' },
      {
        description: 'Sumar dos y restar una da 1',
        expression: 'contador = 0, incrementar(), incrementar(), decrementar(), contador',
        expected: '1',
      },
      { description: 'No baja de cero', expression: 'contador = 0, decrementar(), contador', expected: '0' },
      {
        description: 'La página muestra el valor',
        expression: 'contador = 0, incrementar(), document.querySelector("#valor").textContent',
        expected: '"1"',
      },
    ],
  },
  {
    id: 'depura-tipos',
    mode: 'debug',
    title: 'El precio que se pega',
    summary: 'TypeScript avisa antes de ejecutar: aprende a leer sus mensajes.',
    statement: `\`precioFinal\` debería sumar el IVA (21 %) a un precio escrito como texto, por ejemplo \`"100"\` → \`121\`.

Antes de ejecutar nada, mira la pestaña **Problemas**: el compilador de TypeScript ya ha encontrado dónde está el fallo. Corrígelo sin quitar los tipos.`,
    files: [
      {
        path: 'main.ts',
        content: `function precioFinal(precioEscrito: string): number {
  const precio: number = precioEscrito;
  const iva = precio * 0.21;
  return precio + iva;
}

console.log(precioFinal('100'));
`,
      },
    ],
    tests: [
      { description: '100 con IVA es 121', expression: 'precioFinal("100")', expected: '121' },
      { description: '0 con IVA es 0', expression: 'precioFinal("0")', expected: '0' },
    ],
  },
];

export const CATALOG: CatalogEntry[] = [...TEMPLATES, ...CHALLENGES, ...DEBUG_EXERCISES];

export function catalogEntry(id: string | null): CatalogEntry | null {
  return CATALOG.find((entry) => entry.id === id) ?? null;
}
