Imagina que escribes una carta a mano. Pones un título grande arriba, luego párrafos, quizá una lista. Nadie te lo explica: se entiende por la forma. El navegador no ve formas, solo texto, así que necesita que le digas qué es cada cosa. Para eso existe **HTML**. Y para decir cómo debe verse (de qué color, de qué tamaño) existe **CSS**.

## HTML: etiquetas que dicen qué es cada cosa

HTML (*HyperText Markup Language*, lenguaje de marcado) no es un lenguaje de programación: no calcula nada. Solo **marca** el contenido con **etiquetas**.

```html
<!-- index.html -->
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Mi tienda</title>
  </head>
  <body>
    <h1>Zapatillas Nube</h1>
    <p>Las más <strong>ligeras</strong> del mercado.</p>
    <ul>
      <li>Talla 42</li>
      <li>Color azul</li>
    </ul>
    <button>Comprar</button>
  </body>
</html>
```

Línea a línea:

- `<!doctype html>` avisa al navegador de que es HTML moderno.
- `<html lang="es">` envuelve toda la página. `lang="es"` es un **atributo**: un dato extra de la etiqueta (aquí, el idioma).
- `<head>` guarda información **sobre** la página que no se ve dentro de ella: `<meta charset="utf-8" />` permite tildes y eñes, y `<title>` es el texto de la pestaña.
- `<body>` es el cuerpo: **todo lo visible** va aquí.
- `<h1>` es el título principal; `<p>`, un párrafo; `<strong>`, texto importante (negrita); `<ul>` una lista y cada `<li>` un elemento de ella; `<button>`, un botón.

Casi todas las etiquetas se abren (`<p>`) y se cierran (`</p>`), y lo que hay en medio es su contenido. Al conjunto de etiqueta + contenido se le llama **elemento**.

Así lo pinta el navegador:

```pantalla
@url localhost:4200/
<h1>Zapatillas Nube</h1>
<p>Las más <strong>ligeras</strong> del mercado.</p>
<ul><li>Talla 42</li><li>Color azul</li></ul>
<button>Comprar</button>
```

> [!analogia]
> Las etiquetas son como las cajas de una mudanza con su etiqueta escrita: «cocina», «libros». El contenido es lo que hay dentro, y unas cajas pueden ir dentro de otras: la lista `<ul>` contiene sus `<li>`.

## CSS: cómo se ve cada cosa

CSS (*Cascading Style Sheets*, hojas de estilo) describe el aspecto. Se escribe en reglas: **a quién** se aplica (el **selector**) y **qué** cambia (pares **propiedad: valor**).

```css
/* estilos.css */
h1 {
  color: darkblue;
  font-size: 32px;
}

.oferta {
  background-color: gold;
  padding: 8px;
}
```

- `h1 { ... }` se aplica a **todos** los `<h1>` de la página.
- `color: darkblue;` cambia el color del texto. Cada línea termina en `;`.
- `.oferta` (con punto) es un selector de **clase**: se aplica a los elementos que tengan `class="oferta"`.

Para usar ese CSS, el HTML lo enlaza en el `<head>` y marca el elemento con la clase:

```html
<head>
  <link rel="stylesheet" href="estilos.css" />
</head>
<body>
  <h1>Zapatillas Nube</h1>
  <p class="oferta">¡Hoy, 20 % de descuento!</p>
</body>
```

```pantalla
@url localhost:4200/
<h1 style="color: darkblue; font-size: 32px">Zapatillas Nube</h1>
<p style="background-color: gold; padding: 8px">¡Hoy, 20 % de descuento!</p>
```

> [!idea]
> HTML dice **qué es** cada cosa; CSS dice **cómo se ve**. Mantenerlos separados permite cambiar el aspecto sin tocar el contenido.

## Y en Angular…

En Angular escribirás HTML y CSS casi igual que aquí. La diferencia es que cada trozo de pantalla (un botón de compra, una tarjeta de producto) tendrá **su propio** HTML y **su propio** CSS, en archivos como `app.html` y `app.css`. A esos trozos se les llama **componentes** y los conocerás en el módulo 5.

> [!prueba]
> Crea en tu ordenador un archivo `prueba.html` con el primer ejemplo (usa el Bloc de notas o cualquier editor), guárdalo y ábrelo con doble clic. Cambia el texto del `<h1>` y recarga el navegador con **F5**.

> [!cuidado]
> Olvidar cerrar una etiqueta (`<strong>ligeras` sin `</strong>`) no da error: el navegador intenta adivinar y todo lo que viene después sale en negrita. HTML perdona los errores en silencio, así que si algo se ve raro, revisa los cierres.

> [!resumen]
> - HTML marca el contenido con etiquetas: `<h1>`, `<p>`, `<ul>`, `<li>`, `<button>`…
> - Los atributos (`lang="es"`, `class="oferta"`) dan datos extra a una etiqueta.
> - CSS aplica reglas `selector { propiedad: valor; }` para cambiar el aspecto.
> - En Angular cada componente tendrá su propio HTML y su propio CSS.
