En una tienda, cuando un producto se agota pasan tres cosas a la vez: el botón **Comprar** se desactiva, el nombre aparece tachado y la foto cambia. Ninguna de esas cosas es texto: son **propiedades** de los elementos (`disabled`, una clase CSS, el `src` de la imagen). La interpolación `{{ }}` solo rellena texto. Para todo lo demás está el **enlace de propiedades**, con corchetes: `[ ]`.

> [!analogia]
> Piensa en un elemento HTML como un aparato con mandos: un interruptor `disabled`, un selector `src`, una ruedecita de color. El enlace `[disabled]="agotado"` es un cable que une ese mando a un dato de tu clase. Cuando el dato cambia, el mando se mueve solo.

## Corchetes: de la clase al elemento

```typescript
// src/app/producto/producto.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-producto',
  template: `
    <img [src]="foto" [alt]="'Foto de ' + nombre" />
    <h2 [class.agotado]="agotado" [style.color]="agotado ? 'gray' : 'black'">{{ nombre }}</h2>
    <div class="barra" [style.width.%]="valoracion * 20"></div>
    <button [disabled]="agotado" [attr.data-producto]="nombre">Comprar</button>
  `,
  styles: `
    .agotado { text-decoration: line-through; }
    .barra { height: 6px; background: gold; }
  `,
})
export class Producto {
  protected readonly nombre = 'Taza azul';
  protected readonly foto = 'taza.png';
  protected readonly agotado = true;
  protected readonly valoracion = 4;
}
```

Qué hace cada enlace:

- `[src]="foto"`: lo de la derecha de `=` **no es texto, es una expresión**. Angular evalúa `foto` (vale `'taza.png'`) y lo pone en la propiedad `src` de la imagen.
- `[alt]="'Foto de ' + nombre"`: como es una expresión, para escribir texto fijo necesitas comillas simples dentro de las dobles.
- `[disabled]="agotado"`: la propiedad `disabled` del botón recibe `true` o `false`. Con `true`, el botón no se puede pulsar.
- `[class.agotado]="agotado"`: **enlace de clase**. Añade la clase CSS `agotado` cuando la expresión es verdadera y la quita cuando es falsa.
- `[style.color]="..."`: **enlace de estilo**. Pone un estilo concreto. Con unidad: `[style.width.%]` o `[style.width.px]` añaden `%` o `px` al número.
- `[attr.data-producto]="nombre"`: **enlace de atributo**, lo explicamos abajo.
- `styles:` son los estilos del componente, en línea (como `template:`). En tu proyecto irían en `producto.css` con `styleUrl`.

Esto es lo que el navegador termina mostrando. Debajo, el HTML real que Angular deja en el DOM (sin unos atributos `_ngcontent-…` que añade para aislar los estilos y que verás en el módulo 16):

```pantalla
@url localhost:4200/
<img alt="Foto de Taza azul" width="80" height="80" style="background:#ddd" />
<h2 style="color: gray; text-decoration: line-through">Taza azul</h2>
<div style="height:6px; background:gold; width:80%"></div>
<button disabled>Comprar</button>
```

```html
<img src="taza.png" alt="Foto de Taza azul">
<h2 style="color: gray;" class="agotado">Taza azul</h2>
<div class="barra" style="width: 80%;"></div>
<button disabled="" data-producto="Taza azul">Comprar</button>
```

Si `agotado` pasara a `false`, Angular quitaría la clase `agotado`, pondría el color negro y quitaría `disabled`. Sin una sola línea de código para buscar elementos.

> [!prueba]
> En tu proyecto, pon en `app.ts` una propiedad `protected readonly bloqueado = true;` y en `app.html` un `<button [disabled]="bloqueado">Enviar</button>`. Guarda y comprueba que no se puede pulsar. Cambia a `false`, guarda, y ya se puede.

## Propiedad o atributo: por qué existe `[attr.]`

El HTML que escribes tiene **atributos** (`<img src="...">`). Cuando el navegador lo lee, crea objetos en el DOM con **propiedades** (`img.src`). Casi siempre coinciden, y `[src]` escribe la propiedad. Pero algunos atributos no tienen propiedad equivalente: los `data-*` (datos tuyos pegados a un elemento) o `colspan` de una celda. Si escribes `[colspan]="2"`, Angular busca una propiedad con ese nombre y el compilador falla:

```text
NG8002: Can't bind to 'colspan' since it isn't a known property of 'td'.
```

Con `[attr.colspan]="2"` le dices: «escríbelo como atributo». Los atributos de accesibilidad ARIA (`aria-label`, `aria-expanded`…) son una excepción cómoda: en Angular 22 puedes escribir `[aria-label]` directamente.

## Varias clases o estilos a la vez

`[class]` y `[style]` aceptan un objeto:

```html
<p [class]="{ aviso: true, grande: tamanio > 2 }">Oferta</p>
<p [style]="{ 'font-weight': 'bold', color: colorElegido }">Oferta</p>
```

Cada clave del objeto `[class]` es una clase que se pone si su valor es verdadero. Las clases escritas de forma normal (`class="barra"`) se respetan: Angular solo añade y quita las suyas.

> [!cuidado]
> Sin corchetes, Angular no evalúa nada: `disabled="agotado"` pone el texto `"agotado"`, y `<button disabled="false">` ¡sigue desactivado!, porque para el HTML basta con que el atributo exista. Si el valor sale de tu clase o es una expresión, usa corchetes. Si es un texto fijo, no los necesitas: `alt="Logo"`.

## Interpolación o corchetes

`<img src="{{ foto }}">` también funciona: para propiedades de texto, Angular lo convierte en `[src]="foto"`. Pero solo sirve para texto. Para `true`/`false`, números u objetos usa siempre corchetes. La costumbre habitual: `{{ }}` entre etiquetas, `[ ]` en atributos.

En proyectos antiguos verás `[ngClass]` y `[ngStyle]`; hacen lo mismo que `[class]` y `[style]`. Los verás en el módulo 9.

> [!resumen]
> - `[propiedad]="expresión"` enlaza una propiedad del elemento a un dato de la clase y la mantiene al día.
> - `[class.nombre]` pone o quita una clase; `[style.prop]` y `[style.prop.px]` ponen un estilo.
> - `[attr.nombre]` escribe atributos que no tienen propiedad, como `colspan` o `data-*`.
> - Sin corchetes, el valor es texto fijo y no se evalúa.
