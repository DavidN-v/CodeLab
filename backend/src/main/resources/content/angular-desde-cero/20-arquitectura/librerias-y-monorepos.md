Tu empresa tiene tres apps de Angular: la tienda, el panel de administración y la app de los repartidores. Las tres usan el mismo botón, la misma tarjeta de producto y el mismo servicio de sesión. Hoy están copiados y pegados en los tres proyectos. Cuando alguien arregla un fallo en el botón de la tienda, los otros dos siguen con el fallo.

La solución es sacar ese código común a una **librería**: un paquete con componentes, servicios y pipes que varias apps importan, como importan `@angular/core`.

> [!analogia]
> Una cadena de panaderías con un **obrador central**. Cada tienda podría hacer su propia masa, pero entonces cada una sabría distinta y una mejora en la receta habría que contarla tienda por tienda. Con el obrador, la masa se hace en un sitio y llega igual a todas. La librería es el obrador; las apps, las tiendas.

## Un workspace, varios proyectos

Un *workspace* de Angular es la carpeta que crea `ng new`, con su `angular.json`. Hasta ahora ha tenido un solo proyecto, pero puede tener muchos: varias aplicaciones y varias librerías. Fíjate en esta línea de `angular.json`, que lleva ahí desde el principio:

```json
"newProjectRoot": "projects",
```

Dice dónde se crearán los proyectos nuevos. Para crear una librería:

```bash
ng generate library ui-kit
```

```text
CREATE projects/ui-kit/README.md (1431 bytes)
CREATE projects/ui-kit/ng-package.json (155 bytes)
CREATE projects/ui-kit/package.json (210 bytes)
CREATE projects/ui-kit/tsconfig.lib.json (486 bytes)
CREATE projects/ui-kit/tsconfig.lib.prod.json (401 bytes)
CREATE projects/ui-kit/tsconfig.spec.json (449 bytes)
CREATE projects/ui-kit/src/public-api.ts (70 bytes)
CREATE projects/ui-kit/src/lib/ui-kit.spec.ts (526 bytes)
CREATE projects/ui-kit/src/lib/ui-kit.ts (194 bytes)
UPDATE angular.json (2616 bytes)
UPDATE package.json (811 bytes)
UPDATE tsconfig.json (1111 bytes)
```

```arbol
mi-empresa/
  projects/
    ui-kit/                    # La librería: un proyecto más del workspace
      src/
        lib/
          ui-kit.ts            # Un componente de ejemplo con el selector lib-ui-kit
          ui-kit.spec.ts       # Su prueba
        public-api.ts          # La «puerta de entrada»: lo que la librería deja usar desde fuera
      ng-package.json          # Configuración de ng-packagr: dónde está la entrada y dónde compilar
      package.json             # El nombre, la versión y las dependencias de la librería
      tsconfig.lib.json        # Opciones de TypeScript para compilar la librería
      tsconfig.lib.prod.json   # Las mismas, para la compilación de producción
      tsconfig.spec.json       # Opciones de TypeScript para sus pruebas
      README.md                # Instrucciones de la librería
  src/                         # La aplicación de siempre
  angular.json                 # Ahora con dos proyectos: la app y ui-kit
  tsconfig.json                # Con un alias "ui-kit" que apunta a dist/ui-kit
```

## La puerta de entrada: public-api.ts

```typescript
// projects/ui-kit/src/public-api.ts
/*
 * Public API Surface of ui-kit
 */

export * from './lib/ui-kit';
```

Una librería puede tener cien archivos internos, pero las apps **solo** pueden usar lo que se exporta aquí. Es su contrato: lo de dentro se puede reorganizar libremente sin romper a nadie. Si creas un botón en `projects/ui-kit/src/lib/boton.ts`, lo añades:

```typescript
export * from './lib/ui-kit';
export * from './lib/boton';
```

## Compilar y usar la librería

Las librerías no se compilan con el mismo *builder* que las apps. En `angular.json` el proyecto nuevo usa `"builder": "@angular/build:ng-packagr"`: **ng-packagr** es la herramienta que empaqueta una librería en el formato estándar de los paquetes de Angular (el mismo que usan `@angular/core` o `@angular/material`). `ng generate library` la añade a tus `devDependencies`.

```bash
ng build ui-kit
```

El resultado queda en `dist/ui-kit`. Y para que la app la importe por su nombre, `tsconfig.json` ha recibido un **alias de ruta**:

```json
"paths": {
  "ui-kit": ["./dist/ui-kit"]
}
```

Gracias a él, en la app escribes exactamente lo mismo que con una librería de npm:

```typescript
import { Boton } from 'ui-kit';
```

TypeScript traduce `'ui-kit'` a `./dist/ui-kit`. Si un día publicas la librería en npm (con `npm publish` desde `dist/ui-kit`), las apps de otros repositorios la instalarán con `npm install` y el import será idéntico.

> [!cuidado]
> El alias apunta a `dist/`, es decir, a la librería **compilada**. Si cambias el código de la librería y no ejecutas `ng build ui-kit` (o `ng build ui-kit --watch` mientras trabajas), la app sigue usando la versión anterior. Es la confusión más típica: «he cambiado el botón y no cambia nada».

## Monorepos y Nx

Un **monorepo** es un único repositorio con muchas apps y librerías que comparten código y versiones. El workspace de Angular ya es un monorepo sencillo. Cuando crece mucho (decenas de librerías, varios equipos), se suele usar **Nx**, una herramienta externa (no es de Angular) que añade:

- un **grafo de dependencias** de tus proyectos, para saber qué afecta a qué;
- compilar y probar **solo lo afectado** por un cambio, con caché;
- reglas que prohíben importaciones entre ciertas librerías (por ejemplo, que una *feature* importe otra *feature*), aplicando automáticamente las reglas de dependencia de la lección 1.

No necesitas Nx para empezar. Tenlo en el radar para cuando el workspace se quede pequeño.

> [!prueba]
> En tu proyecto, ejecuta `ng g library ui-kit --dry-run` para ver qué crearía sin tocar nada. Si te animas a crearla de verdad, añade un componente con `ng g c boton --project ui-kit`, expórtalo en `public-api.ts`, ejecuta `ng build ui-kit` y úsalo en tu app con `import { Boton } from 'ui-kit';`.

> [!resumen]
> - Un workspace de Angular puede tener varias apps y librerías en `projects/`.
> - `ng generate library` crea la librería, la registra en `angular.json` y añade un alias en `tsconfig.json`.
> - `public-api.ts` decide qué puede usar el resto: es el contrato de la librería.
> - ng-packagr la compila en `dist/`; Nx ayuda cuando el monorepo crece mucho.
