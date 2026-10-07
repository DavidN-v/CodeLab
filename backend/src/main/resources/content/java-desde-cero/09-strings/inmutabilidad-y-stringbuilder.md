## Los String no cambian

Un `String` es **inmutable**: una vez creado, su contenido no puede modificarse. Los métodos que parecen cambiarlo en realidad crean uno nuevo:

```java
public class Main {
    public static void main(String[] args) {
        String saludo = "hola";
        saludo.toUpperCase();          // crea "HOLA"... y lo descarta
        System.out.println(saludo);    // sigue siendo "hola"

        saludo = saludo.toUpperCase(); // guardamos el nuevo
        System.out.println(saludo);    // "HOLA"
    }
}
```

> **Error frecuente:** llamar a `texto.replace(...)` o `texto.strip()` y no guardar el resultado. El String original no se entera.

La inmutabilidad tiene ventajas: los String se pueden compartir sin miedo, usar como claves en mapas y entre hilos. Pero tiene un coste cuando construyes texto pieza a pieza.

## El problema de concatenar en un bucle

```java fragment
String resultado = "";
for (int i = 0; i < 10000; i++) {
    resultado += i + ",";   // cada vuelta crea un String nuevo y copia todo lo anterior
}
```

Cada `+=` copia el texto acumulado entero. Con miles de vueltas, el programa se vuelve lentísimo.

## StringBuilder

`StringBuilder` es un texto **mutable**, pensado para construirse poco a poco:

```java
public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append(i);
            if (i < 5) {
                sb.append(", ");
            }
        }
        String resultado = sb.toString();
        System.out.println(resultado);   // 1, 2, 3, 4, 5
    }
}
```

Sus métodos más útiles:

```java
public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("Java");
        sb.append(" 21");          // añade al final
        sb.insert(0, "¡");         // inserta en una posición
        sb.append('!');
        System.out.println(sb);    // ¡Java 21!
        sb.reverse();              // invierte
        System.out.println(sb);
        sb.setLength(0);           // vacía
        System.out.println("[" + sb + "]");
        System.out.println(new StringBuilder("radar").reverse());
    }
}
```

`append` devuelve el propio `StringBuilder`, así que puedes encadenar: `sb.append("a").append(1).append('!')`.

## ¿Cuándo usar cada uno?

| Situación | Usa |
| --- | --- |
| Unir unas pocas piezas en una línea | `+` (el compilador ya lo optimiza) |
| Construir texto dentro de un bucle | `StringBuilder` |
| Invertir un texto | `new StringBuilder(texto).reverse()` |

## Resumen

- Los String son inmutables: guarda siempre el resultado de sus métodos.
- Concatenar con `+=` en bucles es lento; usa `StringBuilder` y `append`.
- Convierte el resultado con `toString()` cuando termines.
