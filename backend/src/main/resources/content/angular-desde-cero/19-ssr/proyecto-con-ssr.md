Para que Angular genere HTML en el servidor hacen falta tres cosas que una app normal no tiene: un **programa servidor** que reciba las peticiones, una **forma de arrancar Angular fuera del navegador** y una **configuración** que diga qué rutas se renderizan dónde. La CLI lo crea todo por ti. Hay dos caminos:

```bash
# Proyecto nuevo con SSR desde el principio
ng new tienda --ssr

# Proyecto que ya existe: añade SSR encima
ng add @angular/ssr
```

`ng new` sin `--ssr` te pregunta si quieres SSR; con `--ssr` responde que sí sin preguntar. `ng add @angular/ssr` instala el paquete `@angular/ssr` y ejecuta su *schematic* (un programa que modifica tu proyecto) para crear los mismos archivos. En los dos casos el resultado es igual.

## Los archivos nuevos

Comparado con un `ng new` normal, aparecen cuatro archivos y cambian otros tres:

```arbol
tienda/
  src/
    main.ts                    # Arranque en el NAVEGADOR (igual que siempre)
    main.server.ts             # NUEVO. Arranque en el SERVIDOR: la misma App con la config del servidor
    server.ts                  # NUEVO. El servidor web (Express) que recibe peticiones y llama a Angular
    app/
      app.config.ts            # CAMBIA. Añade provideClientHydration() para hidratar en el navegador
      app.config.server.ts     # NUEVO. Config extra del servidor, mezclada con la del navegador
      app.routes.ts            # Tus rutas de siempre
      app.routes.server.ts     # NUEVO. Cómo se renderiza cada ruta: servidor, prerender o cliente
  angular.json                 # CAMBIA. Le dice al build que genere también el servidor
  package.json                 # CAMBIA. Nuevas librerías y un script para arrancar el servidor
  tsconfig.app.json            # CAMBIA. Añade los tipos de Node.js ("types": ["node"])
```

Vamos uno por uno, en el orden en que se ejecutan.

## server.ts: el servidor web

```typescript
// src/server.ts (sin los comentarios que trae)
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
```

- **Los imports.** `@angular/ssr/node` es la parte de `@angular/ssr` pensada para Node.js: `AngularNodeAppEngine` es el «motor» que renderiza tu app para una petición. `express` es la librería de servidores web más usada en Node: recibe peticiones HTTP y decide qué responder. `node:path` viene con Node y une rutas de carpetas.
- **`browserDistFolder`**: la carpeta donde el build deja los archivos del navegador (`main-….js`, estilos, imágenes). `import.meta.dirname` es la carpeta del propio servidor compilado.
- **`express.static(...)`**: primera parada. Si la petición es un archivo que existe (`/main-NV6SKXPL.js`, `/favicon.ico`), lo envía tal cual. `maxAge: '1y'` le dice al navegador que lo guarde un año en caché: es seguro porque los nombres llevan *hash* y cambian en cada versión. `index: false` evita que sirva `index.html` por su cuenta: de eso se encarga Angular.
- **`angularApp.handle(req)`**: segunda parada, para todo lo demás (`/`, `/productos/3`…). Angular renderiza la ruta y devuelve una respuesta. Si no sabe manejarla, devuelve `null` y `next()` pasa la petición al siguiente manejador.
- **`app.listen(port)`**: arranca el servidor en el puerto de la variable de entorno `PORT` o, si no existe, en el 4000. Solo si este archivo es el programa principal (`isMainModule`) o lo lanza el gestor de procesos PM2 (`pm_id`).
- **`reqHandler`**: el mismo servidor exportado como función. Lo usan `ng serve` y algunos hostings (Firebase, Netlify…) que arrancan el servidor a su manera.

> [!idea]
> Encima del bloque de Angular puedes añadir tus propias rutas de Express, por ejemplo `app.get('/api/salud', …)`. El comentario que trae el archivo lo sugiere. Así un mismo servidor sirve tu API y tu app.

## main.server.ts: arrancar Angular en el servidor

```typescript
// src/main.server.ts
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
```

Es el gemelo de `main.ts`, con dos diferencias. No arranca nada al cargarse: **exporta una función** que el motor llama **una vez por petición**. Y recibe un `context` (el documento de esa petición), porque en el servidor no hay un único `document` global: cada visitante tiene el suyo.

## app.config.server.ts: la configuración del servidor

```typescript
// src/app/app.config.server.ts
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

`provideServerRendering` (de `@angular/ssr`) prepara Angular para renderizar en el servidor y `withRoutes(serverRoutes)` le pasa las reglas de renderizado de cada ruta. `mergeApplicationConfig` (de `@angular/core`) **suma** esta configuración a la del navegador: en el servidor tienes todos tus *providers* (router, HTTP…) más los del servidor.

## app.routes.server.ts: cómo se renderiza cada ruta

```typescript
// src/app/app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
```

Por defecto, **todas** las rutas (`'**'`) se prerenderizan durante el build. Lo cambiarás en la lección 4.

## angular.json y package.json

En `angular.json`, dentro de `build.options`, aparecen estas líneas:

```json
"server": "src/main.server.ts",
"outputMode": "server",
"security": {
  "allowedHosts": []
},
"ssr": {
  "entry": "src/server.ts"
}
```

`server` es el punto de entrada de Angular en el servidor, `ssr.entry` el del servidor Express, y `outputMode: "server"` pide al build una carpeta con servidor (la alternativa, `"static"`, solo genera archivos estáticos). `allowedHosts` lo verás enseguida.

En `package.json` se añaden `@angular/platform-server` (la plataforma de Angular para ejecutarse fuera del navegador), `@angular/ssr`, `express` y, en desarrollo, `@types/express` y `@types/node` (los tipos de TypeScript de esas librerías). Y un script nuevo:

```json
"serve:ssr:tienda": "node dist/tienda/server/server.mjs"
```

## Compilar y arrancar

`ng serve` ya renderiza en el servidor mientras desarrollas: no tienes que hacer nada distinto. Para producción, `ng build` genera dos grupos de archivos:

```bash
ng build
```

```text
Browser bundles
Initial chunk files  | Names            |  Raw size | Estimated transfer size
main-NV6SKXPL.js     | main             | 255.41 kB |                71.34 kB
styles-5INURTSO.css  | styles           |   0 bytes |                 0 bytes

Server bundles
Initial chunk files  | Names            |  Raw size
server.mjs           | server           | 920.52 kB |
main.server.mjs      | main.server      | 535.30 kB |
polyfills.server.mjs | polyfills.server | 235.58 kB |

Prerendered 1 static route.
Application bundle generation complete. [5.231 seconds]
```

```arbol
dist/tienda/
  browser/                 # Lo que descarga el navegador
    index.html             # La portada YA RENDERIZADA (prerender)
    index.csr.html         # Plantilla vacía, para rutas en modo cliente
    main-NV6SKXPL.js       # Tu app para el navegador
  server/                  # Lo que ejecuta Node.js
    server.mjs             # El servidor Express compilado: se arranca con node
    main.server.mjs        # Tu app compilada para el servidor
  prerendered-routes.json  # Lista de rutas prerenderizadas en el build
```

Y lo arrancas con `npm run serve:ssr:tienda`.

> [!cuidado]
> Si arrancas el servidor de producción tal cual y abres `http://localhost:4000`, verás **400 Bad Request** y en la terminal: `Header "host" with value "localhost:4000" is not allowed`. Es una protección: Angular solo atiende peticiones dirigidas a dominios que tú autorizas (así evita ataques que engañan al servidor para que haga peticiones a otros sitios). Añade tus dominios a `"allowedHosts": ["localhost", "mitienda.com"]` en `angular.json` y vuelve a compilar, o usa la variable de entorno `NG_ALLOWED_HOSTS=localhost`.

> [!prueba]
> En una carpeta fuera de cualquier proyecto, ejecuta `ng new tienda --ssr --defaults`. Después `cd tienda`, añade `"localhost"` a `allowedHosts`, ejecuta `ng build` y `npm run serve:ssr:tienda`. Abre `localhost:4000` y mira el código fuente con `Ctrl+U`: esta vez el texto de la página **sí** está en el HTML.

> [!resumen]
> - `ng new --ssr` o `ng add @angular/ssr` crean `server.ts`, `main.server.ts`, `app.config.server.ts` y `app.routes.server.ts`.
> - `server.ts` es un servidor Express: sirve los archivos estáticos y pasa el resto de peticiones a `AngularNodeAppEngine`.
> - `main.server.ts` exporta una función que arranca la misma `App` una vez por petición, con la config del navegador más la del servidor.
> - `ng build` genera `dist/<app>/browser` y `dist/<app>/server`; en producción configura `allowedHosts` con tus dominios.
