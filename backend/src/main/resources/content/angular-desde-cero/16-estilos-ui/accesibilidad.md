Piensa en quién usa tu app: alguien ciego que la escucha con un **lector de pantalla** (un programa que lee en voz alta lo que hay en la página), alguien que no puede usar el ratón y navega solo con el **teclado**, alguien que ve mal los colores pálidos, o tú mismo con el sol dando en la pantalla del móvil. La **accesibilidad** (abreviada *a11y*: una «a», 11 letras y una «y») es que todas esas personas puedan usar tu app. En muchos países, además, es obligatoria por ley.

> [!analogia]
> Un edificio accesible tiene rampa, ascensor con botones en braille y puertas anchas. No estorban a nadie y a muchos les salvan el día. En una web, las «rampas» son el HTML correcto, las etiquetas para los lectores de pantalla, un foco visible y buen contraste.

## 1. Semántica: usa la etiqueta que significa lo que haces

El lector de pantalla y el teclado entienden el **significado** de las etiquetas. Un `<button>` se anuncia como «botón», recibe el foco con la tecla Tab y se pulsa con Enter o Espacio. Un `<div>` con `(click)` no hace nada de eso.

```html
<!-- Mal: no se puede usar con teclado y el lector no sabe que es un botón -->
<div class="boton" (click)="guardar()">Guardar</div>

<!-- Bien -->
<button type="button" (click)="guardar()">Guardar</button>
```

Lo mismo con el resto: `<a routerLink>` para ir a otra página, `<button>` para hacer algo, `<h1>`…`<h6>` para los títulos en orden, `<nav>`, `<main>`, `<ul>` para listas y `<label>` para cada campo de formulario.

## 2. Un ejemplo completo

```typescript
// src/app/buscador/buscador.ts
import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-buscador',
  template: `
    <label for="busqueda">Buscar fruta</label>
    <input id="busqueda" #campo type="search" [value]="texto()" (input)="texto.set(campo.value)" />
    <button type="button" (click)="limpiar()">Limpiar</button>

    <p aria-live="polite">{{ resultados().length }} resultados</p>
    <ul>
      @for (fruta of resultados(); track fruta) {
        <li>{{ fruta }}</li>
      }
    </ul>
  `,
  styles: `
    :focus-visible {
      outline: 3px solid #6d28d9;
      outline-offset: 2px;
    }
  `,
})
export class Buscador {
  private readonly frutas = ['Manzana', 'Mango', 'Pera', 'Melón'];
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  protected readonly texto = signal('');
  protected readonly resultados = computed(() =>
    this.frutas.filter((f) => f.toLowerCase().includes(this.texto().toLowerCase())),
  );

  protected limpiar() {
    this.texto.set('');
    this.campo().nativeElement.focus();
  }
}
```

Qué hace cada pieza por la accesibilidad:

- `<label for="busqueda">` + `id="busqueda"`: une el texto con el campo. El lector dice «Buscar fruta, campo de búsqueda», y pulsar en el texto pone el cursor en el campo. Un `placeholder` **no** sustituye a una etiqueta: desaparece al escribir.
- `aria-live="polite"`: **ARIA** (*Accessible Rich Internet Applications*) son atributos que dan información extra a las tecnologías de apoyo. `aria-live` hace que el lector anuncie los cambios de ese párrafo («3 resultados») cuando el usuario deja de escribir, sin mover el foco.
- `:focus-visible`: el **foco** es el elemento que recibe el teclado. Este estilo dibuja un borde claro cuando se llega con Tab. Nunca pongas `outline: none` sin un sustituto: quien usa teclado se queda a ciegas.
- `viewChild.required(...)` y `focus()`: tras pulsar «Limpiar», el foco vuelve al campo para seguir escribiendo. Gestionar el foco es tu trabajo cuando algo aparece o desaparece (`viewChild` lo viste en el módulo 8).
- `import { …, ElementRef, viewChild } from '@angular/core'`: `ElementRef` envuelve el elemento real del DOM; `viewChild` lo busca en la plantilla por su nombre `#campo`.

```pantalla
@url localhost:4200/
<label for="b">Buscar fruta</label>
<input id="b" type="search" value="m" style="outline:3px solid #6d28d9;outline-offset:2px">
<button>Limpiar</button>
<p>3 resultados</p>
<ul><li>Manzana</li><li>Mango</li><li>Melón</li></ul>
```

## 3. ARIA con bindings

Cuando un atributo ARIA depende del estado, usa un *binding* de atributo `[attr.…]`:

```html
<button type="button" (click)="abierto.set(!abierto())" [attr.aria-expanded]="abierto()" aria-controls="panel-ayuda">
  Ayuda
</button>
@if (abierto()) {
  <div id="panel-ayuda">Aquí va la ayuda.</div>
}
```

- `[attr.aria-expanded]`: el lector dice «Ayuda, botón, contraído» o «expandido».
- `aria-controls`: indica qué elemento abre ese botón.
- Un botón que solo tiene un icono (como «×») necesita nombre: `[attr.aria-label]="'Quitar ' + tarea.texto"`.

> [!cuidado]
> La primera regla de ARIA: **si existe una etiqueta HTML que hace lo que quieres, úsala** en lugar de ARIA. `<div role="button" tabindex="0">` necesita además manejar Enter y Espacio a mano; `<button>` ya lo trae todo.

## 4. Contraste y color

El texto normal necesita un **contraste** de al menos 4,5 a 1 con su fondo (3 a 1 en textos grandes), según las pautas WCAG, el estándar internacional de accesibilidad. Gris claro sobre blanco no suele llegar. Y no comuniques nada **solo** con color: un campo con error debe tener también un mensaje de texto, no solo un borde rojo.

## Ayuda de las herramientas

- El CDK trae `@angular/cdk/a11y`: `cdkTrapFocus` (encierra el foco dentro de un diálogo), `LiveAnnouncer` (anuncia mensajes al lector) y `FocusMonitor`.
- Los componentes de Angular Material ya vienen con teclado, foco y ARIA resueltos.
- En el navegador, la pestaña **Lighthouse** de las herramientas de desarrollo (F12) puntúa la accesibilidad y te dice qué falla.

> [!prueba]
> En tu proyecto, deja el ratón a un lado y recorre la app solo con Tab, Mayúsculas+Tab, Enter y Espacio. ¿Ves siempre dónde está el foco? ¿Puedes hacer todo? Lo que no puedas, tampoco puede una persona que no usa ratón.

> [!resumen]
> - Usa la etiqueta HTML correcta (`button`, `a`, `label`, títulos en orden): trae teclado y significado gratis.
> - Añade ARIA solo cuando el HTML no basta, con `[attr.aria-…]` si depende del estado.
> - Cuida el foco (visible y en su sitio tras cada acción) y el contraste (4,5 a 1 en texto normal).
