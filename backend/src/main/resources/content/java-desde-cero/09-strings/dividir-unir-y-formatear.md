Muchas veces el texto llega «empaquetado»: `"Ada,Lovelace,1815"`. Para trabajar con él hay que partirlo en trozos, y al final volver a juntarlo con un formato bonito.

## Dividir con split

`split` parte un texto por un separador y devuelve un array:

> [!analogia]
> `split` es como cortar una barra de pan por las marcas: le dices dónde están los cortes (el separador) y te devuelve los trozos en orden, en un array.

```java
public class Main {
    public static void main(String[] args) {
        String csv = "Ada,Lovelace,1815";
        String[] partes = csv.split(",");
        System.out.println(partes.length);   // 3
        System.out.println(partes[1]);       // Lovelace

        String frase = "  una   frase con    espacios ";
        String[] palabras = frase.strip().split("\\s+");
        System.out.println(palabras.length + " palabras: " + String.join("|", palabras));
    }
}
```

Tras el primer `split`, `partes` apunta a un array nuevo con tres Strings nuevos; `csv` no cambia:

```memoria
stack main
csv: @1
partes: @2
heap
@1 String: "Ada,Lovelace,1815"
@2 String[]: [@3, @4, @5]
@3 String: "Ada"
@4 String: "Lovelace"
@5 String: "1815"
```

El argumento de `split` es una **expresión regular**. Para separar por "uno o más espacios" se usa `"\\s+"`. Algunos caracteres tienen significado especial: para separar por un punto escribe `split("\\.")`, y por una barra vertical `split("\\|")`.

> [!cuidado]
> `split(".")` no separa por puntos: el punto significa «cualquier carácter» y obtienes un array vacío. Escribe `split("\\.")`.

> [!prueba]
> Cambia `csv.split(",")` por `csv.split("a")` y ejecuta. ¿Cuántas partes salen ahora y cuál es `partes[1]`?

## Unir con String.join

El inverso de `split`:

```java
public class Main {
    public static void main(String[] args) {
        String[] dias = {"lunes", "martes", "miércoles"};
        System.out.println(String.join(", ", dias));
        System.out.println(String.join(" -> ", "a", "b", "c"));
    }
}
```

## Formatear con String.format

`String.format` usa los mismos marcadores que `printf`, pero devuelve el texto en lugar de imprimirlo:

> [!analogia]
> Una plantilla de formato es como un formulario con huecos: `%s` es el hueco para un texto, `%d` para un entero y `%.2f` para un decimal con dos cifras. Java rellena los huecos en orden.

```java
public class Main {
    public static void main(String[] args) {
        String linea = String.format("%-10s|%6.2f|%04d", "Café", 1.5, 7);
        System.out.println(linea);
        System.out.println("%s tiene %d años".formatted("Ada", 36));
    }
}
```

| Marcador | Efecto |
| --- | --- |
| `%-10s` | Texto alineado a la izquierda en 10 posiciones |
| `%6.2f` | Decimal con 2 cifras en 6 posiciones |
| `%04d` | Entero de 4 cifras rellenado con ceros |
| `%x` | Entero en hexadecimal |
| `%%` | Un signo `%` literal |

Desde Java 15, `"plantilla".formatted(...)` hace lo mismo que `String.format`.

## Bloques de texto

Para textos de varias líneas, Java 15 introdujo los **bloques de texto**, entre triples comillas:

```java
public class Main {
    public static void main(String[] args) {
        String menu = """
            === MENÚ ===
            1. Nueva partida
            2. Salir
            """;
        System.out.print(menu);
    }
}
```

La sangría común se elimina automáticamente y no hace falta escapar las comillas ni escribir `\n`.

## Texto y números

Un recordatorio de las conversiones que más usarás con texto:

```java
public class Main {
    public static void main(String[] args) {
        String entrada = "12,7,30";
        int suma = 0;
        for (String parte : entrada.split(",")) {
            suma += Integer.parseInt(parte);
        }
        System.out.println("Suma: " + suma);
        System.out.println(String.valueOf(3.5) + Integer.toString(10));
    }
}
```

> [!idea]
> `"12" + "7"` da `"127"`, pero `Integer.parseInt("12") + Integer.parseInt("7")` da `19`. Para hacer cuentas, convierte primero el texto en número.

> [!resumen]
> - `split(regex)` divide en un array; `"\\s+"` separa por espacios.
> - `String.join(separador, partes)` une.
> - `String.format` y `.formatted()` crean texto con formato.
> - Los bloques de texto `"""` simplifican los textos de varias líneas.
