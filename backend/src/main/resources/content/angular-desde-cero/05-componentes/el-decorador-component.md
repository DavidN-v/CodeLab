Una clase de TypeScript, por sí sola, es solo una clase: Angular no sabe que tiene que pintarla. Lo que la convierte en componente es el **decorador** `@Component`, la etiqueta que va justo encima. Dentro lleva un objeto con la "ficha técnica" del componente. En esta lección repasamos cada campo de esa ficha: qué hace, cuándo lo usarás y qué valor tiene por defecto.

> [!analogia]
> El decorador es la **etiqueta de un mueble de IKEA**: el mueble (la clase) es el mismo, pero la etiqueta dice cómo se llama, qué instrucciones lleva, qué tornillos necesita y en qué habitación va. Sin etiqueta, el almacén no sabe qué hacer con él.

## Un componente con casi todos los campos

```typescript
// src/app/aviso/aviso.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Insignia } from '../insignia/insignia';

@Component({
  selector: 'app-aviso',
  imports: [Insignia],
  template: `
    <app-insignia />
    <p>{{ mensaje() }}</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 1rem;
      border-left: 4px solid orange;
    }
    p {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'alert',
    '[class.urgente]': 'urgente()',
  },
})
export class Aviso {
  protected readonly mensaje = signal('Tu sesión caduca en 5 minutos');
  protected readonly urgente = signal(true);
}
```

```pantalla
@url localhost:4200/
<div style="display:block;padding:1rem;border-left:4px solid orange">
  <strong>⚠ Aviso</strong>
  <p style="margin:0">Tu sesión caduca en 5 minutos</p>
</div>
```

## Campo a campo

### selector

`selector: 'app-aviso'` es el nombre con el que se usa: `<app-aviso />`. Reglas: siempre con un **guion** (los nombres sin guion están reservados para las etiquetas del HTML) y con el **prefijo** del proyecto (`app-`) para no chocar con componentes de otras librerías. También existen selectores de atributo (`'[appResaltar]'`), que usarás en las directivas (módulo 9).

### template o templateUrl

La plantilla: el HTML que pinta el componente. Hay dos formas, y se usa **una de las dos**:

- `templateUrl: './aviso.html'`: en un archivo aparte. Es lo que genera el CLI y lo mejor cuando la plantilla tiene más de unas pocas líneas.
- `template: \`...\``: en línea, dentro del `.ts`, entre comillas invertidas (que permiten varias líneas). Cómodo para plantillas cortas.

### styles o styleUrl

Lo mismo para el CSS: `styleUrl: './aviso.css'` (un archivo), `styleUrls: [...]` (varios, forma antigua) o `styles` en línea. Estos estilos están **encapsulados**: Angular añade un atributo único a los elementos del componente (verás cosas como `_ngcontent-a-c87` en F12), así que el `p { margin: 0 }` de `Aviso` no afecta a los `<p>` del resto de la app. El selector especial `:host` apunta al propio elemento `<app-aviso>`. Más en el módulo 16.

### imports

La lista de componentes, directivas y pipes que **usa esta plantilla**. `Aviso` usa `<app-insignia />`, así que importa `Insignia` dos veces: con `import` de TypeScript (para tener la clase) y en `imports` del decorador (para que el compilador sepa qué es `<app-insignia>`). Lo verás con calma en la próxima lección.

### changeDetection

Cómo decide Angular cuándo revisar este componente para actualizar la pantalla (la **detección de cambios**):

- `ChangeDetectionStrategy.OnPush`: solo lo revisa cuando cambia un *signal* que lee su plantilla, cuando ocurre un evento dentro de él o cuando recibe datos nuevos de su padre. Rápido y predecible.
- `ChangeDetectionStrategy.Eager`: lo revisa cada vez que se revisa su padre.

> [!idea]
> En Angular 22, **OnPush es el valor por defecto**: el CLI ni siquiera lo escribe. Si usas *signals* para los datos que cambian (módulo 7), no tienes que preocuparte por este campo. El antiguo valor `Default` ahora se llama `Eager` y está marcado como obsoleto.

### host

Atributos, clases y eventos para el **propio elemento** del componente (`<app-aviso>`), que no está dentro de su plantilla sino en la del padre:

- `role: 'alert'`: añade el atributo fijo `role="alert"` (los lectores de pantalla anuncian el aviso).
- `'[class.urgente]': 'urgente()'`: añade la clase `urgente` mientras el signal valga `true`.

En el DOM queda así: `<app-aviso role="alert" class="urgente">`.

### Otros campos que verás

| Campo | Para qué | Módulo |
| --- | --- | --- |
| `providers` | Servicios propios de este componente y sus hijos | 10 |
| `encapsulation` | Cambiar cómo se aíslan los estilos (`Emulated`, `None`, `ShadowDom`) | 16 |
| `standalone` | En código antiguo, `standalone: true`. Hoy es el valor por defecto y no se escribe | — |

## Qué hace el compilador con todo esto

El decorador no es magia en tiempo de ejecución. Durante el build, el compilador de Angular lo lee y lo convierte en una definición estática (`static ɵcmp = ɵɵdefineComponent({ selectors: [["app-aviso"]], template: function ... })`), con la plantilla traducida a instrucciones JavaScript. Por eso un error en la plantilla aparece **al compilar**, no cuando el usuario abre la página.

> [!cuidado]
> Las rutas de `templateUrl` y `styleUrl` son **relativas al archivo `.ts`**, y una letra mal escrita rompe el build: `templateUrl: './aviso.htm'` da `NG2008: Could not find template file './aviso.htm'.` Y usa solo una de las dos formas: si escribes `template` y `templateUrl` a la vez, una de ellas se ignora en silencio y acabarás editando la que no se ve.

> [!prueba]
> En tu proyecto, en `app.ts`, añade al decorador `host: { class: 'raiz' }` y guarda. Abre F12 y mira la etiqueta `<app-root>`: ahora tiene `class="raiz"`.

> [!resumen]
> - `selector` (con guion y prefijo), `template`/`templateUrl` y `styles`/`styleUrl` definen cómo se usa, qué pinta y cómo se ve.
> - `imports` lista lo que usa la plantilla; `host` añade atributos, clases o eventos al propio elemento.
> - `changeDetection` es `OnPush` por defecto en Angular 22; con signals funciona sin pensar en él.
> - El compilador convierte el decorador en código JavaScript durante el build.
