A menudo tienes un valor de un tipo y lo necesitas en otro: una nota entera que quieres dividir con decimales, un precio decimal que quieres mostrar sin céntimos… Java convierte solo cuando es seguro y te obliga a pedirlo explícitamente cuando podrías perder información.

> [!analogia]
> Pasar agua de un vaso a una jarra grande es fácil: cabe todo. Pasarla de la jarra al vaso es arriesgado: puede que se derrame. Java hace lo primero por ti y, para lo segundo, quiere que digas "sé lo que hago".

## Conversión automática (ensanchamiento)

Pasar de un tipo "pequeño" a uno "grande" es automático, porque no se pierde nada:

```
byte → short → int → long → float → double
```

```java
public class Main {
    public static void main(String[] args) {
        int entero = 7;
        long largo = entero;      // automático
        double decimal = entero;  // automático: 7.0
        System.out.println(largo + " " + decimal);
    }
}
```

## Casting: conversión explícita

Para ir en sentido contrario hay que escribir el tipo destino entre paréntesis. Eso se llama **casting**, y es tu forma de decir "sé que puedo perder información":

```java
public class Main {
    public static void main(String[] args) {
        double precio = 9.99;
        int truncado = (int) precio;   // 9: se descarta la parte decimal, no se redondea
        long grande = 3_000_000_000L;
        int roto = (int) grande;       // no cabe: el valor se corrompe
        System.out.println(truncado + " " + roto);
    }
}
```

> [!cuidado]
> `(int) 9.99` da `9`, no `10`: el casting **corta** los decimales, no redondea. Y sin el `(int)`, `int truncado = precio;` ni siquiera compila (`incompatible types: possible lossy conversion from double to int`).

Si quieres **redondear** en vez de truncar, usa `Math.round`:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(Math.round(9.99));   // 10
        System.out.println(Math.round(9.49));   // 9
    }
}
```

## La trampa de la división entera

Cuando los dos operandos de `/` son enteros, el resultado es **entero** y se descartan los decimales:

```java
public class Main {
    public static void main(String[] args) {
        int a = 7;
        int b = 2;
        System.out.println(a / b);            // 3
        System.out.println((double) a / b);   // 3.5
        System.out.println(a / 2.0);          // 3.5
    }
}
```

> [!analogia]
> La división entera es como repartir 7 caramelos entre 2 niños sin partir ninguno: a cada uno le tocan 3 y sobra 1. Para hablar de "3 y medio" tienes que permitir trozos, es decir, decimales.

> [!prueba]
> Cambia `int b = 2;` por `int b = 4;` y vuelve a ejecutar. La primera línea muestra `1` y la segunda `1.75`: ¿ves por qué? ¿Y por qué la tercera sigue igual?

Basta con que **uno** de los operandos sea decimal para que la división sea decimal. Ojo: `(double) (a / b)` da `3.0`, porque primero se hace la división entera y luego se convierte.

## Promoción en expresiones

En una operación con tipos mezclados, Java convierte todo al tipo más amplio presente. `int + double` da `double`; `int + long` da `long`. Y cualquier operación con `byte`, `short` o `char` produce como mínimo un `int`.

## Formatear decimales al imprimir

Para mostrar un `double` con un número fijo de decimales, usa `printf` o `String.format`:

```java
public class Main {
    public static void main(String[] args) {
        double media = 7.0 / 3;
        System.out.println(media);
        System.out.printf("%.2f%n", media);
        String texto = String.format("%.1f", media);
        System.out.println("Media: " + texto);
    }
}
```

El separador decimal de `printf` depende de la configuración regional. En esta plataforma es el punto (`2.33`); en un ordenador configurado en español puede salir coma (`2,33`).

> [!resumen]
> - De pequeño a grande es automático; de grande a pequeño necesita casting `(tipo)`.
> - El casting de decimal a entero **trunca**; para redondear usa `Math.round`.
> - Entero entre entero es división entera: convierte uno de los dos a `double` antes de dividir.
> - `printf("%.2f", x)` muestra un decimal con dos cifras.
