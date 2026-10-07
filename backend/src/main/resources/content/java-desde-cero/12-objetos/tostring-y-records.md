## toString

Al imprimir un objeto o unirlo a un texto, Java llama a su método `toString()`. Por defecto devuelve algo poco útil como `Libro@6d06d69c`. Sobrescríbelo para dar una representación legible:

> [!analogia]
> `toString` es la etiqueta de la estantería de una tienda: en vez de un código interno raro, pone «Rayuela, 600 páginas».

```java
class Libro {
    private final String titulo;
    private final int paginas;

    Libro(String titulo, int paginas) {
        this.titulo = titulo;
        this.paginas = paginas;
    }

    @Override
    public String toString() {
        return titulo + " (" + paginas + " págs.)";
    }
}

public class Main {
    public static void main(String[] args) {
        Libro libro = new Libro("Rayuela", 600);
        System.out.println(libro);              // llama a toString()
        System.out.println("Leyendo: " + libro);
    }
}
```

> [!prueba]
> Borra el método `toString` entero (con su `@Override`) y vuelve a ejecutar: ¿qué se imprime ahora?

Un buen `toString` facilita muchísimo depurar: en un mensaje de error o un log verás el contenido del objeto.

## Records: clases de datos en una línea

Muchas clases solo transportan datos: un punto, una fecha, un resultado. Escribir constructor, getters, `equals`, `hashCode` y `toString` para cada una es repetitivo. Desde Java 16, un **record** lo genera todo:

> [!analogia]
> Un record es como una ficha de cartulina ya impresa: solo rellenas los huecos (los datos) y la ficha viene con todo lo demás de serie.

```java
record Punto(int x, int y) {}

public class Main {
    public static void main(String[] args) {
        Punto a = new Punto(3, 4);
        Punto b = new Punto(3, 4);
        System.out.println(a);              // Punto[x=3, y=4]
        System.out.println(a.x() + a.y());  // los "getters" se llaman como el campo
        System.out.println(a.equals(b));    // true
        System.out.println(a == b);         // false: siguen siendo objetos distintos
    }
}
```

Un record:

- Tiene campos `private final` con los componentes declarados.
- Genera el constructor, los accesores `x()` e `y()`, `equals`, `hashCode` y `toString`.
- Es **inmutable**: no hay setters.

> [!cuidado]
> Los accesores de un record no empiezan por `get`: es `a.x()`, no `a.getX()`.

## Añadir lógica a un record

Puedes añadir métodos y validar en un **constructor compacto** (sin lista de parámetros):

```java
record Fraccion(int numerador, int denominador) {
    Fraccion {
        if (denominador == 0) {
            throw new IllegalArgumentException("Denominador cero");
        }
    }

    double valor() {
        return (double) numerador / denominador;
    }

    static Fraccion entera(int n) {
        return new Fraccion(n, 1);
    }
}

public class Main {
    public static void main(String[] args) {
        Fraccion f = new Fraccion(3, 4);
        System.out.println(f + " = " + f.valor());
        System.out.println(Fraccion.entera(5));
    }
}
```

## ¿Clase o record?

| Usa un record cuando… | Usa una clase cuando… |
| --- | --- |
| El objeto es un conjunto de valores | El objeto tiene comportamiento y estado que cambia |
| La igualdad es "mismos valores" | La identidad importa más que los valores |
| No necesita cambiar tras crearse | Necesita modificarse (una cuenta, un carrito) |

> [!resumen]
> - Sobrescribe `toString` para que tus objetos se impriman de forma legible.
> - `record Nombre(tipo a, tipo b) {}` crea una clase de datos inmutable con todo generado.
> - Los accesores de un record se llaman como el componente: `punto.x()`.
> - Valida en el constructor compacto y añade los métodos que necesites.
