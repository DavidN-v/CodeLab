Angular no es un único programa: es un **equipo de librerías**, cada una con un trabajo. Unas viajan dentro de tu aplicación hasta el navegador del usuario; otras se quedan en tu ordenador y solo sirven para construir, probar y formatear. La lista completa está en `package.json`. En esta lección leemos el archivo y las librerías que viajan con la app; en la siguiente, las herramientas que se quedan en tu ordenador.

> [!analogia]
> Piensa en una película. Los **actores** salen en pantalla: son las `dependencies`, que acaban dentro de la app que ve el usuario. El **equipo técnico** (cámaras, focos, montadores) es imprescindible para rodar, pero no sale en la película: son las `devDependencies`.

## package.json, línea a línea

```json
{
  "name": "mi-app",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "packageManager": "npm@11.19.0",
  "dependencies": {
    "@angular/common": "^22.2.0",
    "@angular/compiler": "^22.2.0",
    "@angular/core": "^22.2.0",
    "@angular/forms": "^22.2.0",
    "@angular/platform-browser": "^22.2.0",
    "@angular/router": "^22.2.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0"
  },
  "devDependencies": {
    "@angular/build": "^22.2.1",
    "@angular/cli": "^22.2.1",
    "@angular/compiler-cli": "^22.2.0",
    "jsdom": "^30.0.0",
    "prettier": "^3.8.1",
    "typescript": "~6.0.2",
    "vitest": "^5.0.0"
  }
}
```

- `name` y `version`: identifican el paquete. `0.0.0` porque aún no has publicado nada.
- `scripts`: atajos que ejecutas con `npm run <nombre>` (o `npm start` / `npm test`, que no necesitan `run`). Fíjate en que todos llaman a la CLI: `npm start` es lo mismo que `ng serve`. ¿Por qué existen, entonces? Porque usan la CLI **del proyecto** (la de `node_modules`), no la que tengas instalada globalmente, y así todo el equipo usa la misma versión. `watch` recompila en modo desarrollo cada vez que guardas.
- `private: true`: evita publicar por error tu app en el registro público de npm.
- `packageManager`: qué gestor de paquetes (y qué versión) usa el proyecto.
- `^22.2.0` y `~7.8.0`: recuerda del módulo 3 que `^` acepta nuevas versiones *minor* (22.3, 22.4…) y `~` solo *patch* (7.8.1, 7.8.2…).

## Las dependencies: lo que llega al navegador

| Librería | Para qué sirve |
| --- | --- |
| `@angular/core` | El corazón: componentes (`@Component`), *signals* (`signal`, `computed`), inyección de dependencias (`inject`), detección de cambios y el ciclo de vida. Casi todos tus archivos importan algo de aquí. |
| `@angular/common` | Utilidades comunes que usan las plantillas: pipes (`date`, `currency`, `uppercase`…), `NgOptimizedImage`, `Location` y también el cliente HTTP (`@angular/common/http`). |
| `@angular/platform-browser` | El puente con el navegador: `bootstrapApplication` arranca la app y su *renderer* crea y modifica elementos reales del DOM. También trae `Title`, `Meta` y la sanitización de seguridad. |
| `@angular/router` | La navegación entre "páginas" sin recargar: `provideRouter`, `<router-outlet>`, `routerLink`. Lo verás en el módulo 11. |
| `@angular/forms` | Formularios: `FormsModule` (`ngModel`), `ReactiveFormsModule` (`FormControl`, `FormGroup`) y validadores. Módulo 12. |
| `@angular/compiler` | El compilador de plantillas: convierte `<h1>{{ title() }}</h1>` en instrucciones JavaScript. Normalmente trabaja durante el build (a través de `compiler-cli`), así que en producción casi nunca viaja al navegador; está aquí porque algunas herramientas, como las pruebas, lo usan al ejecutar. |
| `rxjs` | La librería de *observables*: flujos de valores en el tiempo (respuestas HTTP, eventos del router). Angular la usa por dentro. Módulo 14. |
| `tslib` | Pequeñas funciones de ayuda que TypeScript necesita al traducir ciertas construcciones (decoradores, `async`…). Con la opción `importHelpers` se importan de aquí en vez de copiarse en cada archivo. |

> [!idea]
> Fíjate en lo que **no** está: `zone.js`. Las versiones antiguas de Angular la necesitaban para enterarse de los cambios. Las apps nuevas de Angular 22 son *zoneless*: Angular sabe qué repintar gracias a los *signals* y a los eventos de la plantilla.

> [!prueba]
> En tu proyecto, abre `node_modules/@angular/core/package.json` y busca `"version"`. Después ejecuta `ng version`: verás la misma versión junto a la de cada paquete de la lista.

> [!resumen]
> - `dependencies` viajan con la app: core, common, platform-browser, router, forms, compiler, rxjs y tslib.
> - Los `scripts` son atajos a la CLI del proyecto: `npm start` = `ng serve`.
> - `^` acepta versiones *minor* nuevas; `~`, solo *patch*.
> - Angular 22 ya no usa zone.js.
