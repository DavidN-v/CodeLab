Un programa que solo escribe siempre hace lo mismo. Para que reaccione a lo que le das, tiene que **leer**. La forma más sencilla de leer de la consola (la *entrada estándar*) es la clase `Scanner`.

## Tu primer Scanner

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);

        System.out.print("¿Cómo te llamas? ");
        String nombre = entrada.nextLine();

        System.out.println("Encantado, " + nombre + ".");
    }
}
```

Línea a línea:

- `import java.util.Scanner;` le dice al compilador dónde está la clase `Scanner`. Los `import` van al principio del archivo, antes de la clase.
- `new Scanner(System.in)` crea un lector conectado a la entrada estándar.
- `entrada.nextLine()` lee una línea completa de texto y la devuelve.
- `String nombre = ...` guarda esa línea en una **variable** llamada `nombre`. Las variables las verás a fondo en el próximo módulo.

> **En esta plataforma** la entrada no se teclea mientras el programa corre: la escribes antes en el panel **Entrada** del playground y se le entrega al programa al ejecutarlo. En los ejercicios, cada caso de prueba trae su propia entrada.

Prueba el ejemplo en el playground escribiendo tu nombre en el panel de entrada.

## Leer números

`Scanner` tiene un método para cada tipo:

| Método | Lee |
| --- | --- |
| `nextLine()` | El resto de la línea, como texto |
| `next()` | La siguiente palabra (hasta un espacio o salto de línea) |
| `nextInt()` | Un número entero |
| `nextDouble()` | Un número decimal |
| `nextBoolean()` | `true` o `false` |

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
        int a = entrada.nextInt();
        int b = entrada.nextInt();
        System.out.println(a + " + " + b + " = " + (a + b));
    }
}
```

Con la entrada `7 5` (o `7` y `5` en líneas distintas) imprime `7 + 5 = 12`. `nextInt`, `next` y `nextDouble` saltan los espacios y saltos de línea que encuentran antes del valor.

## La trampa de nextInt seguido de nextLine

Mira este programa con la entrada `30` en una línea y `Ada` en la siguiente:

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
        int edad = entrada.nextInt();
        String nombre = entrada.nextLine();
        System.out.println("[" + nombre + "] tiene " + edad);
    }
}
```

Imprime `[] tiene 30`. `nextInt()` lee el `30` pero **deja en la entrada el salto de línea** que venía detrás. El `nextLine()` siguiente encuentra ese salto de línea y devuelve la línea vacía que hay antes de él.

La solución es consumir ese resto de línea antes de leer la siguiente:

```java
int edad = entrada.nextInt();
entrada.nextLine();               // descarta el final de la línea del número
String nombre = entrada.nextLine();
```

## Decimales y la coma

`nextDouble()` interpreta el número según la configuración regional. En esta plataforma usa el punto (`3.5`). Si en tu ordenador te pide coma, puedes fijar el formato:

```java
Scanner entrada = new Scanner(System.in).useLocale(java.util.Locale.US);
```

## Resumen

- `Scanner` lee de la entrada estándar; necesita `import java.util.Scanner;`.
- `nextLine()` lee líneas; `next()`, `nextInt()` y `nextDouble()` leen valores sueltos.
- Tras `nextInt()` o `nextDouble()`, llama a `nextLine()` una vez antes de leer una línea completa.
