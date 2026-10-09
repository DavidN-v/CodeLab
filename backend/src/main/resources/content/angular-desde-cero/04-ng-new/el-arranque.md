Abres `localhost:4200` y en menos de un segundo aparece «Hello, mi-app». Pero si miras el HTML que envía el servidor, dentro del `<body>` solo hay una etiqueta vacía: `<app-root></app-root>`. ¿Quién escribe el título? ¿Cuándo? ¿En qué orden? En esta lección seguimos los tres primeros pasos del arranque, archivo por archivo, y en la siguiente veremos cómo se pinta el componente.

> [!analogia]
> Arrancar una app Angular es como abrir un teatro. `index.html` es el **escenario vacío** con una marca en el suelo (`<app-root>`). `main.ts` es el **regidor** que da la orden de empezar. `app.config.ts` es la **lista del equipo técnico** que tiene que estar en su puesto antes de subir el telón. Y `App` es la **obra**, que se representa justo encima de la marca.

## 1. index.html: el escenario vacío

```html
<!-- src/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MiApp</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

- `<!doctype html>` y `<meta charset="utf-8" />`: página HTML moderna con tildes y eñes bien escritas.
- `<title>MiApp</title>`: el texto de la pestaña (el nombre del proyecto en *PascalCase*).
- `<base href="/" />`: la dirección base para las rutas relativas. El router la usa para saber dónde empieza tu app; si la publicas en `ejemplo.com/tienda/`, cambiará a `/tienda/`.
- `<meta name="viewport">`: hace que en el móvil la página use el ancho real de la pantalla en vez de verse diminuta.
- `<link rel="icon">`: el `favicon.ico` de `public/`.
- `<app-root></app-root>`: una etiqueta inventada. El navegador no sabe qué es y la deja vacía. Es la marca donde Angular pintará la app.

¿Y el `<script>`? No está porque **lo añade el build**. Al servir la página, la CLI inyecta `<link rel="stylesheet" href="styles.css">` y `<script src="main.js" type="module"></script>`.

## 2. main.ts: la orden de empezar

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

- Línea 1: importa `bootstrapApplication` de `@angular/platform-browser`, la librería que conecta Angular con el navegador. *Bootstrap* significa "arrancar por uno mismo", como tirar de las cintas de tus botas.
- Línea 2: importa la configuración. `./` significa "un archivo nuestro, relativo a esta carpeta"; sin `./` sería una librería de `node_modules`. No se escribe `.ts`.
- Línea 3: importa la clase del componente raíz.
- Línea 5: «arranca la aplicación usando `App` como raíz y `appConfig` como configuración». Devuelve una **promesa** (módulo 2): el arranque termina un poco después. Si algo falla al arrancar, `.catch` escribe el error en la consola del navegador en vez de perderlo.

## 3. app.config.ts y app.routes.ts: el equipo técnico

```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes)],
};
```

- `ApplicationConfig` (de `@angular/core`) es el **tipo** del objeto: TypeScript comprueba que solo tenga campos válidos.
- `providers` es la lista de **proveedores**: piezas que la app tendrá disponibles en cualquier sitio gracias a la inyección de dependencias (módulo 10). Cada función `provide...()` devuelve un paquete de proveedores ya preparado.
- `provideBrowserGlobalErrorListeners()`: escucha los errores que nadie captura (los eventos `error` y `unhandledrejection` de `window`) y se los pasa al gestor de errores de Angular, para que ninguno pase desapercibido.
- `provideRouter(routes)` (de `@angular/router`): activa el router con la lista de rutas.

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [];
```

Una lista vacía de rutas con su tipo, `Routes`. La rellenarás en el módulo 11.

Hasta aquí, el navegador tiene una página vacía y Angular ya sabe con qué configuración arrancar. Falta lo más visible: el componente `App`, que veremos en la siguiente lección.

> [!prueba]
> Abre `src/index.html` y cambia `<title>MiApp</title>` por `<title>Mi primera app</title>`. Guarda con `ng serve` en marcha: la pestaña del navegador cambia de nombre.

> [!resumen]
> - `index.html` solo tiene `<app-root>` vacío; el build le añade el `<script src="main.js">`.
> - `main.ts` llama a `bootstrapApplication(App, appConfig)`: primero se evalúan los imports, después arranca.
> - `appConfig.providers` prepara las piezas globales: el router y la escucha de errores.
