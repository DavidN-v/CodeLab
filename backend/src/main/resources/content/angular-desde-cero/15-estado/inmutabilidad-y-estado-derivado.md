Escribes un método que añade un producto a la lista con `push`, pulsas el botón… y el contador de productos no cambia. O cambia a veces. No es magia negra: es que has **mutado** el estado en lugar de **reemplazarlo**, y los signals no se han enterado. En esta lección verás por qué, cómo evitarlo y cómo calcular datos a partir del estado sin duplicarlo.

> [!analogia]
> Un signal es como un portero que vigila **qué caja** hay en la estantería, no lo que hay dentro. Si abres la caja y metes algo (mutar), el portero ve la misma caja de siempre y no avisa a nadie. Si pones una caja **nueva** con el contenido actualizado (reemplazar), el portero ve el cambio y avisa a todos.

## El error: mutar

```typescript
// src/app/compra/compra.ts
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-compra',
  template: `
    <p>Elementos: {{ cuantos() }}</p>
    <p>Lista: {{ lista().join(', ') }}</p>
    <button (click)="anadir()">Añadir</button>
  `,
})
export class Compra {
  protected readonly lista = signal(['pan']);
  protected readonly cuantos = computed(() => this.lista().length);

  protected anadir() {
    this.lista.update((l) => {
      l.push('leche'); // ❌ cambia el array existente
      return l; // devuelve el MISMO array
    });
  }
}
```

Tras pulsar «Añadir» una vez, la pantalla queda así (comprobado en Angular 22):

```pantalla
@url localhost:4200/compra
<p>Elementos: 1</p>
<p>Lista: pan, leche</p>
<button>Añadir</button>
```

¡La lista dice dos cosas y el contador dice una! Lo que ha pasado:

```mermaid
sequenceDiagram
  participant B as Botón
  participant L as signal lista
  participant C as computed cuantos
  participant V as Vista
  B->>L: update(l => { l.push(...); return l })
  L->>L: ¿el valor nuevo es distinto? Object.is(viejo, nuevo) → igual
  Note over L: no avisa a nadie
  B->>V: el clic marca el componente para repintar
  V->>C: cuantos() → no le avisaron, devuelve el 1 guardado
  V->>L: lista().join() → lee el array mutado: "pan, leche"
```

- Un signal compara el valor nuevo con el viejo usando `Object.is`. Para objetos y arrays, eso compara **la referencia** (qué caja), no el contenido.
- Como `update` devolvió el mismo array, el signal decide que no hubo cambio y no avisa a sus dependientes. El `computed` sigue con su valor guardado.
- La plantilla se repinta por el clic y vuelve a leer el array, que sí fue cambiado por dentro. Por eso la pantalla queda incoherente.

## La solución: reemplazar

```typescript
protected anadir() {
  this.lista.update((l) => [...l, 'leche']); // ✅ array nuevo
}
```

Las operaciones inmutables más comunes, todas devuelven un valor **nuevo**:

| Quieres… | Inmutable | Mutable (evitar) |
| --- | --- | --- |
| Añadir al final | `[...lista, nuevo]` | `lista.push(nuevo)` |
| Quitar | `lista.filter((x) => x.id !== id)` | `lista.splice(i, 1)` |
| Cambiar uno | `lista.map((x) => (x.id === id ? { ...x, hecha: true } : x))` | `lista[i].hecha = true` |
| Cambiar un campo de un objeto | `{ ...usuario, nombre: 'Ada' }` | `usuario.nombre = 'Ada'` |
| Ordenar | `[...lista].sort((a, b) => a - b)` | `lista.sort(...)` |

El operador `...` (*spread*, módulo 2) copia los elementos o propiedades en un array u objeto nuevo.

> [!idea]
> La inmutabilidad no es una manía: hace que **cada cambio sea visible** (nueva referencia = algo cambió), permite comparar estados rápido y evita que un componente modifique por accidente un objeto que otro está mostrando.

## Estado derivado: calcula, no guardes

Si puedes **calcular** un dato a partir de otro, no lo guardes aparte:

```typescript
// ❌ Dos fuentes de verdad que hay que mantener sincronizadas a mano
protected readonly tareas = signal<Tarea[]>([]);
protected readonly pendientes = signal(0);

// ✅ Una fuente de verdad y datos derivados
protected readonly tareas = signal<Tarea[]>([]);
protected readonly pendientes = computed(() => this.tareas().filter((t) => !t.hecha).length);
protected readonly porcentaje = computed(() => {
  const total = this.tareas().length;
  return total === 0 ? 0 : Math.round(((total - this.pendientes()) / total) * 100);
});
```

`computed` se recalcula solo cuando cambia algo que lee, guarda el resultado mientras tanto y no se puede escribir. Puedes encadenarlos: `porcentaje` lee `pendientes`, que lee `tareas`.

> [!prueba]
> En tu proyecto, copia el componente `Compra` con el `push` y pulsa «Añadir»: verás «Elementos: 1» junto a «pan, leche». Cámbialo por `update((l) => [...l, 'leche'])` y guarda: ahora el contador sube con cada clic.

> [!cuidado]
> `sort()` y `reverse()` también **mutan** el array original, aunque devuelvan algo. Escribir `this.lista.update((l) => l.sort())` tiene el mismo problema que el `push`. Copia antes: `[...l].sort()`. (JavaScript moderno tiene `toSorted()`, pero el `tsconfig.json` que genera `ng new` apunta a ES2022 y TypeScript no lo reconoce sin cambiar la opción `lib`.)

> [!resumen]
> - Un signal detecta cambios por referencia (`Object.is`): mutar un array u objeto no avisa a nadie.
> - Actualiza siempre con valores nuevos: spread, `map`, `filter`, copiar antes de `sort`.
> - Guarda cada dato una sola vez y calcula el resto con `computed`.
