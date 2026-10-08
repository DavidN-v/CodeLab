Cuando escribes `ng build`, la CLI no adivina nada. ¿Qué archivo es el punto de entrada? ¿Dónde están los estilos globales? ¿Cuánto puede pesar la app antes de avisarte? Todo eso está escrito en **`angular.json`**. Y cuando TypeScript te marca un error en rojo, las reglas que aplica salen de los **`tsconfig*.json`**. Son los dos manuales de instrucciones del proyecto.

> [!analogia]
> `angular.json` es la **receta** que sigue la cocina: qué ingredientes usar, en qué orden y cómo emplatar para un cliente (producción) o para probar en casa (desarrollo). `tsconfig.json` son las **normas de higiene**: no deciden qué cocinas, pero rechazan cualquier plato que no las cumpla.

## angular.json por dentro

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": { "packageManager": "npm" },
  "newProjectRoot": "projects",
  "projects": {
    "mi-app": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": { ... },
        "serve": { ... },
        "test": { "builder": "@angular/build:unit-test" }
      }
    }
  }
}
```

- `$schema`: le dice a VS Code qué campos son válidos, así te autocompleta y subraya errores.
- `newProjectRoot`: un *workspace* puede tener varios proyectos (otra app, una librería); los nuevos irían a `projects/`.
- `projects.mi-app`: tu aplicación. `root: ""` significa que vive en la raíz; `sourceRoot: "src"`, que su código está en `src/`.
- `prefix: "app"`: el prefijo de los selectores. Por eso el componente raíz es `<app-root>` y `ng generate component menu` creará `<app-menu>`.
- `schematics`: opciones por defecto para `ng generate`. Si escribes aquí `"@schematics/angular:component": { "style": "scss" }`, todos tus componentes nuevos usarán SCSS.
- `architect`: los **targets**, las tareas que sabe hacer el proyecto. Cada una tiene un **builder**, el programa que la ejecuta. `ng build` ejecuta el target `build`, `ng serve` el target `serve` y `ng test` el target `test`.

### El target build

```json
"build": {
  "builder": "@angular/build:application",
  "options": {
    "browser": "src/main.ts",
    "tsConfig": "tsconfig.app.json",
    "assets": [{ "glob": "**/*", "input": "public" }],
    "styles": ["src/styles.css"]
  },
  "configurations": {
    "production": {
      "budgets": [
        { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
        { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
      ],
      "outputHashing": "all"
    },
    "development": {
      "optimization": false,
      "extractLicenses": false,
      "sourceMap": true
    }
  },
  "defaultConfiguration": "production"
}
```

| Campo | Qué significa |
| --- | --- |
| `builder` | `@angular/build:application`: compila con esbuild. El nombre es `paquete:builder`. |
| `browser` | El punto de entrada. Desde `main.ts` el empaquetador sigue cada `import` y reúne todo lo que hace falta. |
| `tsConfig` | Qué reglas de TypeScript usar para compilar (las de la app, sin pruebas). |
| `assets` | Archivos que se copian sin tocar: todo (`**/*`) lo que haya en `public/`. |
| `styles` | Hojas de estilo globales que se añaden a la página. |
| `configurations` | Variantes del mismo build. Eliges una con `--configuration` (o `-c`). |
| `budgets` | Límites de tamaño. `initial` es lo que se descarga al abrir la página: avisa a partir de 500 kB y falla a partir de 1 MB. `anyComponentStyle` vigila los estilos de cada componente (4 kB / 8 kB). |
| `outputHashing: "all"` | Añade una huella al nombre de cada archivo (`main-O7QUVEYP.js`). Lo verás en la lección de `ng build`. |
| `optimization: false` | En desarrollo no minimiza el código: compila más rápido y se lee mejor. |
| `extractLicenses: false` | En desarrollo no genera el archivo de licencias de terceros. |
| `sourceMap: true` | Genera mapas para que el depurador del navegador te enseñe tu TypeScript original, no el JavaScript generado. |
| `defaultConfiguration` | `ng build` sin opciones usa `production`. |

Un presupuesto que no se cumple se ve así (bajando a propósito los límites a 100 kB y 200 kB):

```text
▲ [WARNING] bundle initial exceeded maximum budget. Budget 100.00 kB was not met by 116.46 kB with a total of 216.46 kB.
✘ [ERROR] bundle initial exceeded maximum budget. Budget 200.00 kB was not met by 16.46 kB with a total of 216.46 kB.
```

### Los targets serve y test

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "configurations": {
    "production": { "buildTarget": "mi-app:build:production" },
    "development": { "buildTarget": "mi-app:build:development" }
  },
  "defaultConfiguration": "development"
}
```

`serve` no compila por su cuenta: **reutiliza el target `build`** (`buildTarget` se lee `proyecto:target:configuración`) y sirve el resultado con Vite. Por defecto usa `development`, porque mientras trabajas quieres rapidez y mapas de código, no minimizar. El target `test` usa `@angular/build:unit-test`, que lanza Vitest.

## Los tres tsconfig

`tsconfig.json` tiene las opciones comunes. Los otros dos lo **extienden** (`"extends": "./tsconfig.json"`) y solo dicen qué archivos compilan:

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  },
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.spec.json" }]
}
```

| Opción | Qué hace y por qué está |
| --- | --- |
| `noImplicitOverride` | Si redefines un método heredado, tienes que escribir `override`. Evita pisar un método sin querer. |
| `noPropertyAccessFromIndexSignature` | En objetos tipo diccionario obliga a escribir `config['clave']` en vez de `config.clave`, para que se note que la clave puede no existir. |
| `noImplicitReturns` | Si una función devuelve algo en un camino, debe devolver algo en todos. |
| `noFallthroughCasesInSwitch` | Prohíbe que un `case` de un `switch` caiga en el siguiente por olvidar `break`. |
| `skipLibCheck` | No revisa los tipos de las librerías de `node_modules` (ya vienen revisados): compila más rápido. |
| `isolatedModules` | Cada archivo debe poder traducirse solo. Lo exige esbuild, que compila archivos en paralelo. |
| `experimentalDecorators` | Activa los decoradores al estilo que usa Angular (`@Component`, `@Service`…). |
| `importHelpers` | Las funciones de ayuda de TypeScript se importan de `tslib` en vez de copiarse en cada archivo. |
| `target: "ES2022"` | A qué versión de JavaScript se traduce. ES2022 entiende clases, `async`/`await`… sin traducciones extra. |
| `module: "preserve"` | Deja los `import`/`export` tal cual: los resuelve el empaquetador, no TypeScript. |
| `strictInjectionParameters` | Error si Angular no sabe qué inyectar en un parámetro. |
| `strictInputAccessModifiers` | Respeta `private`, `protected` y `readonly` de los *inputs* también en las plantillas. |
| `enableI18nLegacyMessageIdFormat: false` | Usa el formato moderno de identificadores para las traducciones. |
| `files: []` + `references` | El archivo raíz no compila nada: solo reparte el trabajo entre la app y las pruebas. |

¿Y el modo estricto (`strict`)? No aparece porque **TypeScript 6 ya lo activa por defecto**, igual que Angular activa la comprobación estricta de plantillas. Si creas el proyecto con `--strict=false`, verás escrito `"strict": false` y `"strictTemplates": false`.

Los otros dos:

```json
// tsconfig.app.json: la aplicación
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": [] },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

```json
// tsconfig.spec.json: las pruebas
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": ["vitest/globals"] },
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
}
```

- La app compila todos los `.ts` de `src/` **menos** las pruebas, y `types: []` evita cargar tipos globales que no necesita.
- Las pruebas añaden `vitest/globals`: por eso en un `.spec.ts` puedes usar `describe`, `it` y `expect` sin importarlos.

> [!cuidado]
> El modo estricto te va a dar errores como `Parameter 'x' implicitly has an 'any' type` o `Type 'null' is not assignable to type 'number'`. No lo desactives para que desaparezcan: cada uno es un fallo que, sin él, aparecería en el navegador del usuario. Arregla el tipo.

> [!prueba]
> En tu proyecto, en `angular.json`, añade dentro de `"schematics": {}` la línea `"@schematics/angular:component": { "style": "scss" }`. Ejecuta `ng generate component prueba --dry-run` y fíjate en que ahora crearía `prueba.scss`.

> [!resumen]
> - `angular.json` define los *targets* (`build`, `serve`, `test`), el *builder* de cada uno y sus configuraciones (`production`, `development`).
> - `production` comprueba presupuestos de tamaño y añade huellas a los nombres; `development` genera *source maps* y no minimiza.
> - `tsconfig.json` tiene las reglas comunes; `tsconfig.app.json` compila la app y `tsconfig.spec.json` las pruebas.
> - Con TypeScript 6 el modo estricto ya viene activado aunque no lo veas escrito.
