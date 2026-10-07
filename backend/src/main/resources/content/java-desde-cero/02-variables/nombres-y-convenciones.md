Elegir buenos nombres es la mitad de escribir código que se entiende. Java tiene **reglas** (lo que compila) y **convenciones** (lo que espera cualquier programador que lea tu código).

> [!analogia]
> Ponerle nombre a una variable es como etiquetar los botes de la cocina. Puedes llamarlos "bote1", "bote2"… y funcionará, pero el día que busques la sal vas a abrirlos todos. Con "sal", "azúcar" y "harina" no tienes que pensar.

## Las reglas

Un nombre (*identificador*) en Java:

- Puede contener letras, dígitos, `_` y `$`.
- **No** puede empezar por un dígito: `2jugadores` no vale, `jugadores2` sí.
- No puede ser una **palabra reservada** (las que Java ya usa), como `int`, `class`, `public`, `if`, `for`, `new`, `return`…
- Distingue mayúsculas: `total`, `Total` y `TOTAL` son tres nombres distintos.

Técnicamente puedes usar letras con tilde (`año`), pero la costumbre profesional es evitarlas: escribe `anio` o, si tu equipo programa en inglés, `year`. En este curso usamos nombres en español sin tildes.

## Las convenciones

| Qué | Estilo | Ejemplo |
| --- | --- | --- |
| Variables y métodos | camelCase | `precioTotal`, `calcularMedia` |
| Clases | PascalCase | `CuentaBancaria` |
| Constantes | MAYÚSCULAS_CON_GUIONES | `IVA_GENERAL` |

**camelCase**: la primera palabra en minúscula y las siguientes empiezan en mayúscula, sin espacios ni guiones. Las mayúsculas del medio parecen las jorobas de un camello.

> [!cuidado]
> Los nombres no pueden tener espacios ni guiones: `precio total` y `precio-total` no compilan (el guion se lee como una resta). Escribe `precioTotal`.

## Nombres que se explican solos

Compara:

```java fragment
int d = 7;
double p = 19.99;
double t = d * p;
```

con:

```java fragment
int diasDeAlquiler = 7;
double precioPorDia = 19.99;
double totalAPagar = diasDeAlquiler * precioPorDia;
```

El segundo no necesita comentarios. Algunas pautas:

- Sustantivos para datos (`cliente`, `edadMinima`) y verbos para métodos (`calcularTotal`).
- Para booleanos (sí/no), nombres que se lean como pregunta: `esAdulto`, `tieneDescuento`.
- Evita abreviaturas crípticas (`cntUsrAct`). Las de una letra, solo en contextos muy cortos, como el contador `i` de un bucle.

## var: que el compilador deduzca el tipo

Desde Java 10 puedes declarar variables locales con `var`. El compilador deduce el tipo a partir del valor inicial:

```java
public class Main {
    public static void main(String[] args) {
        var mensaje = "Hola";   // String
        var cantidad = 3;       // int
        var precio = 9.5;       // double
        System.out.println(mensaje + " " + cantidad + " " + precio);
    }
}
```

> [!prueba]
> Debajo de `var cantidad = 3;` añade la línea `cantidad = "tres";` y ejecuta. El compilador protesta con `incompatible types`: `cantidad` es un `int` para siempre. Borra la línea y vuelve a ejecutar.

> [!analogia]
> `var` es como dejar que la tienda elija el tamaño de caja según lo que vas a guardar. Una vez elegida, la caja ya no cambia de forma.

`var` **no** hace a Java dinámico: solo te ahorra escribir el tipo cuando ya es obvio. Sus reglas:

- Solo para variables **locales** (dentro de métodos).
- Siempre con valor inicial: `var x;` no compila, porque no hay de dónde deducir el tipo.

Úsalo cuando el tipo se lee a simple vista en la misma línea. Si quien lee tendría que adivinarlo, escribe el tipo.

> [!resumen]
> - Los nombres no empiezan por dígito, no son palabras reservadas y distinguen mayúsculas.
> - Variables en camelCase, clases en PascalCase, constantes en MAYÚSCULAS.
> - Un buen nombre ahorra un comentario.
> - `var` deduce el tipo de una variable local, pero el tipo sigue siendo fijo.
