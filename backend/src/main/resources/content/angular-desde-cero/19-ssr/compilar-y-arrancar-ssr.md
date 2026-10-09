En la lección anterior viste los archivos de código que crea el SSR. Faltan los cambios en la configuración del proyecto y el paso final: compilar y arrancar el servidor.

> [!analogia]
> Ya tienes la cocina montada. Ahora toca firmar los permisos (`angular.json`, `package.json`) y abrir la puerta al público (`ng build` y el servidor).

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
> En el proyecto `tienda` de la lección anterior (o creando uno con `ng new tienda --ssr --defaults`), haz `cd tienda`, añade `"localhost"` a `allowedHosts`, ejecuta `ng build` y `npm run serve:ssr:tienda`. Abre `localhost:4000` y mira el código fuente con `Ctrl+U`: esta vez el texto de la página **sí** está en el HTML.

> [!resumen]
> - `angular.json` añade `server`, `outputMode: "server"`, `ssr.entry` y `security.allowedHosts`.
> - `package.json` suma `@angular/platform-server`, `@angular/ssr`, `express` y el script `serve:ssr:<app>`.
> - `ng build` genera `dist/<app>/browser` y `dist/<app>/server`; en producción configura `allowedHosts` con tus dominios.
