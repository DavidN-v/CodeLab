Abres la carpeta `mi-app` en VS Code y aparecen archivos con nombres raros: `.editorconfig`, `tsconfig.spec.json`, `app.config.ts`… ¿Cuáles tienes que tocar? ¿Cuáles puedes ignorar? ¿Alguno se puede borrar?

La respuesta corta: **tú trabajas casi siempre dentro de `src/`**. Todo lo demás es configuración que lee alguna herramienta. Pero un buen desarrollador sabe para qué existe cada archivo, porque el día que algo falla, el problema suele estar en uno de ellos.

> [!analogia]
> Un proyecto Angular es como una cocina de restaurante. `src/` es la mesa donde cocinas (tu código). Los archivos de la raíz son las fichas pegadas en la pared: la lista de proveedores (`package.json`), las instrucciones del horno (`angular.json`), las normas de la cocina (`tsconfig.json`, `.editorconfig`). `node_modules/` es la despensa: llena, imprescindible, y nadie cocina dentro de ella.

## El árbol completo

Este es el proyecto exacto que crea `ng new mi-app --defaults` con Angular 22. Pulsa en cada archivo para leer qué es:

```arbol
mi-app/                      # La carpeta del proyecto (el "workspace"); la crea ng new
  .vscode/                   # Ajustes para VS Code que se comparten con el equipo
    extensions.json          # Recomienda instalar la extensión oficial de Angular (angular.ng-template)
    launch.json              # Permite depurar con F5: arranca ng serve y abre Chrome en localhost:4200
    tasks.json               # Tareas de VS Code que ejecutan npm start y npm test en segundo plano
  public/                    # Archivos estáticos: se copian tal cual al resultado final
    favicon.ico              # El icono de la pestaña del navegador; cámbialo por el tuyo
  src/                       # Todo el código fuente de tu aplicación: aquí trabajas tú
    app/                     # El componente raíz y la configuración de la aplicación
      app.config.ts          # La configuración global: qué servicios y funciones tiene la app (providers)
      app.css                # Los estilos del componente App; solo afectan a su plantilla
      app.html               # La plantilla de App: el HTML que se ve (hoy, la página de bienvenida)
      app.routes.ts          # La lista de rutas (URL → componente); empieza vacía
      app.spec.ts            # Las pruebas automáticas del componente App (se ejecutan con ng test)
      app.ts                 # El componente raíz App: su clase y su decorador @Component
    index.html               # La única página HTML; Angular pinta la app dentro de <app-root>
    main.ts                  # El punto de entrada: arranca Angular con bootstrapApplication
    styles.css               # Estilos globales: afectan a toda la aplicación
  .editorconfig              # Normas de formato para cualquier editor: 2 espacios, UTF-8, comillas simples en .ts
  .gitignore                 # Lo que Git no debe guardar: node_modules, dist, la caché .angular...
  .prettierrc                # Configuración de Prettier, el formateador: líneas de 100 caracteres, comillas simples
  angular.json               # La configuración de la CLI: cómo construir, servir y probar el proyecto
  package.json               # Las librerías que necesita el proyecto y los comandos npm (start, build, test)
  package-lock.json          # Las versiones exactas instaladas; lo escribe npm, no se edita a mano
  README.md                  # Instrucciones básicas del proyecto (en inglés); puedes reescribirlo
  tsconfig.json              # Opciones comunes del compilador de TypeScript y de Angular
  tsconfig.app.json          # Opciones de TypeScript para compilar la aplicación (sin las pruebas)
  tsconfig.spec.json         # Opciones de TypeScript para compilar las pruebas (añade los tipos de Vitest)
  node_modules/              # Las ~400 librerías descargadas por npm install; nunca se sube a Git
```

Y estas carpetas aparecen **más tarde**, cuando usas el proyecto:

```arbol
mi-app/                      # La misma carpeta, después de trabajar un rato
  .angular/                  # Aparece con el primer ng serve o ng build
    cache/                   # Caché de compilación: hace que la segunda vez sea mucho más rápida
  .git/                      # El repositorio Git que creó ng new (oculto); guarda el historial
  dist/                      # Aparece con ng build: la aplicación lista para publicar
    mi-app/                  # Una carpeta por proyecto
      browser/               # Lo que subes al servidor web: index.html, main-HASH.js, styles-HASH.css
      3rdpartylicenses.txt   # Las licencias de las librerías que van dentro de tu app
```

> [!idea]
> Regla práctica: **edita `src/`**; toca `angular.json`, `tsconfig*.json` y `package.json` solo cuando sepas qué cambias; **nunca** edites `node_modules/`, `dist/`, `.angular/` ni `package-lock.json` a mano. Esas cuatro se regeneran solas.

## Los archivos pequeños de la raíz

Merece la pena mirar dos de ellos por dentro, porque explican cosas que verás a diario.

`.editorconfig` hace que todos los editores del equipo formateen igual:

```text
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.ts]
quote_type = single
```

Por eso en Angular verás **2 espacios** de sangría y **comillas simples** en TypeScript (`'@angular/core'`), y no 4 espacios como en Java.

`.prettierrc` configura Prettier, una herramienta que reescribe tu código con un formato uniforme:

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
}
```

- `printWidth: 100`: corta las líneas que pasen de 100 caracteres.
- `singleQuote: true`: comillas simples.
- `parser: "angular"` para los `.html`: las plantillas de Angular no son HTML puro (tienen `{{ }}`, `@if`…), así que Prettier necesita el analizador de Angular para entenderlas.

Además, la propia CLI usa Prettier: cuando `ng generate` crea archivos, los formatea con él.

## Por qué `.gitignore` excluye tanto

```text
/dist
/node_modules
/.angular/cache
/coverage
```

Todo eso se puede **regenerar**: `node_modules` con `npm install` (gracias a `package-lock.json`), `dist` con `ng build`, la caché con cualquier compilación. Subir 300 MB de librerías a Git solo haría el repositorio lento y enorme.

> [!cuidado]
> Si clonas un proyecto Angular y `ng build` dice `Node packages may not be installed. Try installing with 'npm install'.` seguido de `Could not find the '@angular/build:application' builder's node package.`, no falta nada en el código: falta `node_modules`. Ejecuta `npm install` primero.

> [!prueba]
> En tu proyecto, abre `src/index.html` y cambia `<title>MiApp</title>` por `<title>Mi primera app</title>`. Con `ng serve` en marcha, guarda: la pestaña del navegador cambia de nombre.

> [!resumen]
> - Tu código vive en `src/`: `main.ts` arranca, `index.html` es la única página y `src/app/` contiene el componente raíz y la configuración.
> - La raíz tiene la configuración: `package.json` (librerías), `angular.json` (CLI), `tsconfig*.json` (TypeScript), `.editorconfig` y `.prettierrc` (formato).
> - `public/` se copia tal cual; `node_modules/`, `dist/` y `.angular/` se regeneran y no van a Git.
