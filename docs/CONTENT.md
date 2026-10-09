# Escribir contenido para Forja

Las lecciones, los quizzes, los ejercicios y el glosario son archivos del
repositorio. El backend los sincroniza con la base de datos cada vez que
arranca. Este documento describe el formato de cada archivo y las pautas de
estilo para que el contenido se entienda desde cero.

```
backend/src/main/resources/content/<curso>/
├── glossary.yml                    términos del glosario del curso
└── <NN>-<módulo>/
    ├── module.yml                  lecciones y ejercicios, en orden
    ├── <lección>.md                cuerpo de la lección (Markdown)
    ├── <lección>.quiz.yml          quiz de repaso al final de la lección (opcional)
    └── <ejercicio>.yml             un ejercicio
```

Antes de dar por bueno un cambio, compruébalo:

```bash
python3 tools/verify_content.py 05-condicionales     # un módulo (por prefijo)
python3 tools/verify_content.py --static              # solo estructura, sin ejecutar
```

El verificador ejecuta cada programa en el sandbox real (necesita el
code-runner en `FORJA_RUNNER_URL`, por defecto `http://localhost:8090`).

## Pautas de estilo

Quien lee nunca ha programado. Cada lección:

- **Una idea por lección**, explicada en 3–5 minutos de lectura (unas 300–550
  palabras sin contar el código). Si una lección trata dos ideas, se divide.
- **Empieza por el porqué** con un ejemplo cotidiano y después pasa al código.
- **Analogía** para cada concepto nuevo, en un bloque `[!analogia]`: una
  variable es una caja con etiqueta, un método es una receta, una clase es un
  molde de galletas, un array es una fila de taquillas numeradas.
- **Ejemplos cortos y ejecutables** (con `main`), seguidos a menudo de un
  bloque `[!prueba]` que propone un cambio concreto: «cambia el 5 por un 10 y
  ejecuta».
- **Termina con un `[!resumen]`** de 2–4 puntos con lo que hay que recordar.
- Tutea, frases cortas, sin jerga sin explicar. La primera vez que aparece un
  término técnico, se explica.

## Lecciones

`module.yml`:

```yaml
lessons:
  - slug: que-es-una-variable          # minúsculas, números y guiones
    title: ¿Qué es una variable?
    summary: Declarar, inicializar y reasignar valores con nombre.
    minutes: 5                          # tiempo realista de lectura y práctica
exercises:
  - intercambiar-valores                # slugs únicos en todo el curso
```

El slug identifica la lección y su progreso: no lo cambies. Al dividir una
lección, la primera parte conserva el slug y la segunda recibe uno nuevo.

### Bloques de código

| Bloque | Uso |
| --- | --- |
| ` ```java ` con `main` | Ejemplo ejecutable: botones para ejecutarlo aquí, visualizarlo paso a paso y abrirlo en el playground. Debe compilar. |
| ` ```java fragment ` | Trozo incompleto; solo se resalta. |
| ` ```java error ` | Ejemplo que falla a propósito; no se comprueba. |
| ` ```memoria ` | Diagrama de memoria (pila y montón). |
| ` ```mermaid ` | Diagrama de flujo o de clases (sintaxis de Mermaid). |

### Árbol de archivos (` ```arbol `)

Un proyecto interactivo: las carpetas se abren y cierran, y al elegir un
archivo se muestra para qué sirve. Una entrada por línea, dos espacios por
nivel, las carpetas terminan en `/` y la explicación va tras `#`:

````markdown
```arbol
mi-app/                 # La carpeta del proyecto que crea ng new
  src/                  # Todo el código de tu aplicación
    main.ts             # Punto de entrada: arranca Angular
  package.json          # Librerías del proyecto y comandos
```
````

### Pantalla (` ```pantalla `)

Lo que se ve en el navegador: HTML estático dentro de una ventana de
navegador, en un marco aislado sin scripts (no se permiten `<script>` ni
atributos `on…=`). Una primera línea `@url /ruta` opcional pone el texto de la
barra de direcciones.

````markdown
```pantalla
@url localhost:4200/perfil
<h1>Hola, Ada</h1>
<button>Sumar</button> <span>Contador: 3</span>
```
````

### Recuadros

Un bloque de cita cuya primera línea es `[!tipo]`:

```markdown
> [!analogia]
> Una variable es como una caja con una etiqueta: la etiqueta es el nombre y
> lo que hay dentro es el valor.
```

| Tipo | Título que muestra | Para qué |
| --- | --- | --- |
| `analogia` | Piénsalo así | Comparación con algo cotidiano |
| `idea` | Idea clave | La frase que hay que recordar |
| `prueba` | Pruébalo | Un cambio concreto para hacer en el ejemplo anterior |
| `cuidado` | Cuidado | Un error típico |
| `resumen` | En resumen | Lista breve al final de la lección |

### Diagramas de memoria

```memoria
stack main
edad: 30
nombre: @1
numeros: @2
heap
@1 String: "Ana"
@2 int[]: [1, 2, 3]
@3 Persona: nombre=@1, edad=30
```

- `stack <método>` abre un marco de la pila (puede haber varios, el último
  arriba). Cada línea es `nombre: valor`.
- `heap` abre el montón. Cada línea es `@id Tipo: contenido`.
- Un valor `@id` es una referencia: se dibuja como flecha al objeto.

### Diagramas Mermaid

Para flujos (`flowchart TD`) y jerarquías de clases (`classDiagram`). Texto de
los nodos en español y corto.

## Quiz de la lección

`<lección>.quiz.yml`, 3 preguntas que se responden en un minuto. Se muestran
al final de la lección; cada respuesta enseña su explicación.

```yaml
questions:
  - type: choice
    prompt: ¿Qué guarda una variable de tipo `int`?
    options:
      - Un número entero
      - Un texto
      - Un número con decimales
    answer: 0                       # índice (desde 0) de la opción correcta
    explanation: '`int` guarda enteros, como 42 o -7. Para decimales se usa `double`.'
  - type: output
    prompt: ¿Qué imprime este programa?
    code: |
      public class Main {
          public static void main(String[] args) {
              int x = 5;
              x = x + 2;
              System.out.println(x);
          }
      }
    answer: |
      7
    explanation: Primero `x` vale 5; después se le suma 2 y se guarda de nuevo en `x`.
```

- `choice`: 2–5 opciones distintas; `code` opcional (si tiene `main`, debe
  compilar). Las opciones incorrectas deben ser errores plausibles.
- `output`: el alumno escribe la salida exacta. `code` es un programa completo
  y el verificador comprueba que imprime `answer` (con `input` opcional como
  entrada estándar).
- `explanation` explica por qué, no solo cuál.

## Ejercicios

`<ejercicio>.yml`. Campos comunes:

```yaml
title: Intercambiar valores
summary: Lee dos números y cámbialos de variable usando una tercera.
difficulty: EASY            # EASY, MEDIUM o HARD
kind: code                  # code (por defecto), fix, fill, parsons, predict o project
statement: |                # Markdown
  ...
starter: |                  # lo que ve el alumno al empezar
  ...
solution: |                 # se muestra con «Ver la solución»
  ...
hints:                      # escalera de pistas, de menos a más concreta
  - 'La idea: ...'
  - 'Qué usar: ...'
  - 'El plan: ...'
tests:
  - input: "3 8\n"          # entrada estándar (opcional)
    output: |               # salida exacta esperada
      a = 8
      b = 3
    sample: true            # visible para el alumno; al menos una
  - input: "-5 12\n"
    output: |
      a = 12
      b = -5
```

La comparación de salidas ignora los espacios al final de línea y las líneas
vacías del final; todo lo demás (mayúsculas, espacios internos) cuenta.

### Escalera de pistas

Tres pistas, cada una más concreta que la anterior. El paso siguiente es la
solución.

1. **La idea**: qué hay que conseguir, dicho de otra manera.
2. **Qué usar**: la herramienta de Java (el `if`, un bucle `for`, `Math.max`…).
3. **El plan**: los pasos en pseudocódigo o una línea clave, sin dar el
   programa entero.

Comillas simples alrededor de toda pista que contenga `: ` (si no, YAML la lee
como un mapa).

### Tipos de ejercicio

**`code`**: escribir el programa. El código inicial compila.

**`fix`**: «encuentra el error». `starter` es un programa con uno o dos
errores (de compilación o de lógica) y el verificador comprueba que no pasa
las pruebas. El enunciado describe el síntoma, no el error.

**`fill`**: completar huecos. `starter` es el programa con huecos `{{?}}` y
`answers` la respuesta de cada hueco, en orden. El verificador comprueba que
`starter` con las respuestas es exactamente `solution`. Al corregir se
ejecutan las pruebas, así que cualquier respuesta equivalente vale.

```yaml
kind: fill
starter: |
  public class Main {
      public static void main(String[] args) {
          for (int i = 1; i {{?}} 5; i++) {
              System.out.println(i);
          }
      }
  }
answers:
  - <=
```

**`parsons`**: ordenar líneas. `starter` es el esqueleto con una línea
`{{lines}}`; `lines` son las líneas en el orden correcto (con su sangría);
`distractors` (opcional) son líneas que sobran y que, si se usan, rompen el
programa. El alumno las recibe desordenadas.

```yaml
kind: parsons
starter: |
  public class Main {
      public static void main(String[] args) {
  {{lines}}
      }
  }
lines:
  - '        int suma = 0;'
  - '        for (int i = 1; i <= 3; i++) {'
  - '            suma += i;'
  - '        }'
  - '        System.out.println(suma);'
distractors:
  - '        suma = 0;'
```

**`predict`**: «¿qué imprime?». `starter` es el programa (solo se lee) y la
única prueba lleva su salida, que es la respuesta. No lleva `solution`.

**`project`**: un miniproyecto al final de un bloque (una calculadora, el
ahorcado, una agenda…). Como `code`, pero el enunciado es más largo y se
organiza en pasos.

## Cursos que no se ejecutan (Angular)

El sandbox solo ejecuta Java. Los cursos de otras tecnologías (como
`angular-desde-cero`, del framework Angular) se marcan en la base de datos con
`languages.runnable = false` y siguen estas reglas, que comprueban el
importador y `tools/verify_content.py`:

- Solo ejercicios `fill`, `parsons` y `predict`. Se corrigen comparando con la
  solución, sin ejecutar: en `fill` cada hueco se compara con lo que la
  solución tiene en su sitio, sin tener en cuenta los espacios junto a los
  signos ni el tipo de comillas (`{{titulo()}}` vale como `{{ titulo() }}`);
  en `parsons`, las líneas en orden. Cada ejercicio debe tener una única
  respuesta correcta.
- `predict` lleva una sola prueba, cuya `output` es la respuesta exacta.
- Bloques de código: `typescript`, `html`, `css`, `scss`, `json`, `bash`,
  `text`, `mermaid`, `arbol` y `pantalla`.
- Las preguntas `output` del quiz llevan `code` y `answer`, pero no se
  ejecutan: hay que comprobarlas a mano.
- Los slugs de ejercicio son globales: los de Angular empiezan por `ng-`.

Para revisar solo un curso: `python3 tools/verify_content.py --course
angular-desde-cero 04`.

## Glosario

`glossary.yml` del curso. Las lecciones resaltan la primera aparición de cada
término y muestran su definición al pasar el ratón.

```yaml
terms:
  - term: variable
    aliases: [variables]
    definition: Un nombre que guarda un valor que puede cambiar, como una caja con etiqueta.
```

Definiciones de una o dos frases, sin otros términos técnicos sin explicar.
