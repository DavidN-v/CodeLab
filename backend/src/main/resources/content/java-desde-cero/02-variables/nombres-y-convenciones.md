Elegir buenos nombres es la mitad de escribir código legible. Java tiene reglas (lo que compila) y convenciones (lo que espera cualquier programador que lea tu código).

## Las reglas

Un nombre (identificador) en Java:

- Puede contener letras, dígitos, `_` y `$`.
- **No** puede empezar por un dígito: `2jugadores` no vale, `jugadores2` sí.
- No puede ser una **palabra reservada** como `int`, `class`, `public`, `if`, `for`, `new`, `return`…
- Distingue mayúsculas: `total`, `Total` y `TOTAL` son tres nombres distintos.

Técnicamente puedes usar letras con tilde (`año`), pero la costumbre en el mundo profesional es evitarlas: escribe `anio` o, mejor, un nombre en inglés como `year` si tu equipo programa en inglés. En este curso usamos nombres en español sin tildes.

## Las convenciones

| Qué | Estilo | Ejemplo |
| --- | --- | --- |
| Variables y métodos | camelCase | `precioTotal`, `calcularMedia` |
| Clases | PascalCase | `CuentaBancaria` |
| Constantes | MAYÚSCULAS_CON_GUIONES | `IVA_GENERAL` |

**camelCase**: la primera palabra en minúscula y las siguientes empiezan en mayúscula, sin espacios ni guiones.

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

- Usa sustantivos para datos (`cliente`, `edadMinima`) y verbos para métodos (`calcularTotal`).
- Para booleanos, nombres que se lean como pregunta: `esAdulto`, `tieneDescuento`, `estaVacia`.
- Evita abreviaturas crípticas (`cntUsrAct`). Las de una letra solo en contextos muy cortos, como el contador `i` de un bucle.

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

`var` **no** hace a Java dinámico: `cantidad` sigue siendo `int` para siempre, y `cantidad = "tres";` no compila. Solo te ahorra escribir el tipo cuando ya es obvio.

Reglas de `var`:

- Solo para variables **locales** (dentro de métodos).
- Siempre con valor inicial: `var x;` no compila, porque no hay de dónde deducir el tipo.

> **Consejo:** usa `var` cuando el tipo se lee a simple vista en la misma línea (`var lista = new ArrayList<String>();`). Si el lector tendría que adivinar, escribe el tipo.

## Resumen

- Los nombres no empiezan por dígito ni son palabras reservadas, y distinguen mayúsculas.
- Variables en camelCase, clases en PascalCase, constantes en MAYÚSCULAS.
- Un buen nombre ahorra un comentario.
- `var` deduce el tipo de una variable local, pero el tipo sigue siendo fijo.
