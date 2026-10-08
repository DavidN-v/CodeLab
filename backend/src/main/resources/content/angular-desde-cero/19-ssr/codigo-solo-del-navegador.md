Activas SSR en una app que funcionaba perfectamente, ejecutas `ng serve` y la terminal se llena de rojo:

```text
ERROR ReferenceError: localStorage is not defined
```

Tu componente leía el tema guardado (`claro` u `oscuro`) con `localStorage.getItem('tema')` en el constructor. En el navegador eso existe. Pero ahora el constructor también se ejecuta **en el servidor**, dentro de Node.js, y allí no hay `localStorage`, ni `window`, ni `document`, ni el tamaño de la pantalla. No hay pantalla.

> [!analogia]
> Un actor que ensaya en una sala vacía (el servidor) y luego actúa en el teatro (el navegador). El guion es el mismo, pero en el ensayo no hay público ni focos. Si el guion dice «mira a la tercera fila y saluda a quien esté ahí», en el ensayo no tiene a quién saludar. Esas frases hay que marcarlas: «solo en la función».

## Qué se ejecuta en cada sitio

Este componente escribe en la consola en cada paso. La ruta usa `RenderMode.Server`:

```typescript
// src/app/ficha.ts
import { Component, OnInit, PLATFORM_ID, afterNextRender, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Component({
  selector: 'app-ficha',
  template: `<h2>Ficha</h2>`,
})
export class Ficha implements OnInit {
  private readonly plataforma = inject(PLATFORM_ID);

  constructor() {
    console.log('1. constructor');
    afterNextRender(() => console.log('2. afterNextRender'));
    if (isPlatformBrowser(this.plataforma)) {
      console.log('3. navegador');
    }
    if (isPlatformServer(this.plataforma)) {
      console.log('4. servidor');
    }
  }

  ngOnInit(): void {
    console.log('5. ngOnInit');
  }
}
```

Un visitante abre la página. En la **terminal del servidor** aparece:

```text
1. constructor
4. servidor
5. ngOnInit
```

Y en la **consola del navegador** (`F12`), cuando Angular hidrata:

```text
1. constructor
3. navegador
5. ngOnInit
2. afterNextRender
```

Fíjate en tres cosas: el constructor y `ngOnInit` se ejecutan **en los dos sitios**; `afterNextRender` **solo en el navegador**; y se ejecuta al final, cuando Angular ya ha pintado (o hidratado) la vista.

## Herramienta 1: afterNextRender

`afterNextRender` (de `@angular/core`) recibe una función y la ejecuta **una vez**, después del siguiente pintado, y **nunca en el servidor**. Es el sitio natural para todo lo que necesita un navegador de verdad: `localStorage`, `window`, medir elementos, librerías de gráficos o mapas.

```typescript
// src/app/selector-tema.ts
import { Component, afterNextRender, signal } from '@angular/core';

@Component({
  selector: 'app-selector-tema',
  template: `
    <p>Tema: {{ tema() }}</p>
    <button (click)="cambiar()">Cambiar tema</button>
  `,
})
export class SelectorTema {
  protected readonly tema = signal('claro');

  constructor() {
    afterNextRender(() => {
      this.tema.set(localStorage.getItem('tema') ?? 'claro');
    });
  }

  protected cambiar(): void {
    const nuevo = this.tema() === 'claro' ? 'oscuro' : 'claro';
    this.tema.set(nuevo);
    localStorage.setItem('tema', nuevo);
  }
}
```

- El signal empieza en `'claro'`: es lo que el servidor renderiza, porque allí no sabe qué eligió el usuario.
- En el navegador, después de hidratar, `afterNextRender` lee `localStorage` y actualiza el signal. La pantalla cambia sola.
- `cambiar()` también usa `localStorage`, pero no hay problema: solo se ejecuta al hacer clic, y los clics solo ocurren en el navegador.

Así se ve en las dos fases si el usuario había elegido el tema oscuro:

```pantalla
@url localhost:4000/
<p>Tema: claro</p>
<button>Cambiar tema</button>
```

```pantalla
@url localhost:4000/
<p>Tema: oscuro</p>
<button>Cambiar tema</button>
```

La primera es el HTML del servidor; la segunda, un instante después de hidratar.

## Herramienta 2: isPlatformBrowser

A veces necesitas una decisión, no un momento. `PLATFORM_ID` es un *token* de inyección (una «etiqueta» con la que pides un valor a Angular) que dice en qué plataforma estás. Las funciones `isPlatformBrowser` e `isPlatformServer`, de `@angular/common`, lo traducen a `true` o `false`:

```typescript
private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
```

Prefiere `afterNextRender` siempre que puedas: deja claro **cuándo** se ejecuta el código y no te obliga a repartir `if` por todas partes. Usa `isPlatformBrowser` para decisiones puntuales, como no arrancar un temporizador en el servidor.

> [!cuidado]
> No uses `isPlatformBrowser` para **pintar cosas distintas** en el servidor y en el navegador (`@if (esNavegador) { … }`). El HTML del servidor no coincidiría con el del navegador y la hidratación fallaría (error NG0500, lección 3). Pinta lo mismo en los dos sitios y cambia el estado después, en `afterNextRender`, como en `SelectorTema`.

## Y la petición, ¿se puede leer?

En el servidor sí hay algo que el navegador no tiene: la petición HTTP original. El token `REQUEST` de `@angular/core` te da el objeto `Request` estándar (con sus cabeceras y cookies) mientras se renderiza en el servidor; en el navegador vale `null`. Se pide con `inject(REQUEST, { optional: true })`. Lo usarás poco, pero es útil, por ejemplo, para leer el idioma preferido del visitante.

> [!prueba]
> En tu proyecto con SSR, añade `console.log(window.innerWidth)` en el constructor de `App` y guarda: mira el error en la terminal de `ng serve`. Después mueve esa línea dentro de un `afterNextRender(() => { … })`: el error desaparece y el número sale en la consola del navegador.

> [!resumen]
> - Con SSR, constructores, `ngOnInit` y plantillas se ejecutan también en el servidor, donde no hay `window`, `document` ni `localStorage`.
> - `afterNextRender` ejecuta código una vez, después de pintar, solo en el navegador.
> - `isPlatformBrowser(inject(PLATFORM_ID))` responde «¿estoy en el navegador?» para decisiones puntuales.
> - Pinta lo mismo en servidor y navegador; actualiza el estado después para no romper la hidratación.
