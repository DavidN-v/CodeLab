Un programa que solo escribe siempre hace lo mismo. Para que reaccione a lo que le das, tiene que **leer**. La forma más sencilla de leer de la consola (la *entrada estándar*) es la clase `Scanner`.

> [!analogia]
> Un `Scanner` es como un camarero que toma nota: tú le dices "tráeme una línea" o "tráeme un número" y él lo recoge de lo que el usuario ha escrito y te lo entrega.

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
- `String nombre = ...` guarda esa línea en una **variable** llamada `nombre`, para usarla después. Las variables las verás a fondo en el próximo módulo.

> [!idea]
> En esta plataforma la entrada no se teclea mientras el programa corre: la escribes antes en el panel **Entrada** del playground y se le entrega al programa al ejecutarlo. En los ejercicios, cada caso de prueba trae su propia entrada.

> [!prueba]
> Abre el ejemplo en el playground, escribe tu nombre en el panel **Entrada** y ejecuta. Después cambia `"Encantado, "` por `"¡Qué alegría verte, "` y vuelve a ejecutar.

## Leer números

`Scanner` tiene un método para cada tipo de dato:

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

> [!cuidado]
> Si `nextInt()` encuentra algo que no es un número entero (por ejemplo `hola` o `3.5`), el programa se detiene con una `InputMismatchException`. Comprueba que la entrada tiene lo que tu programa espera.

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

> [!analogia]
> Es como recoger un paquete y dejarte el envoltorio en la mesa. El siguiente `nextLine()` encuentra el envoltorio (el salto de línea) y cree que eso era la línea que le pedías.

La solución es consumir ese resto de línea antes de leer la siguiente:

```java fragment
int edad = entrada.nextInt();
entrada.nextLine();               // descarta el final de la línea del número
String nombre = entrada.nextLine();
```

## Decimales y la coma

`nextDouble()` interpreta el número según la configuración regional. En esta plataforma usa el punto (`3.5`). Si en tu ordenador te pide coma, puedes fijar el formato:

```java fragment
Scanner entrada = new Scanner(System.in).useLocale(java.util.Locale.US);
```

> [!resumen]
> - `Scanner` lee de la entrada estándar; necesita `import java.util.Scanner;`.
> - `nextLine()` lee líneas completas; `next()`, `nextInt()` y `nextDouble()` leen valores sueltos.
> - Tras `nextInt()` o `nextDouble()`, llama a `nextLine()` una vez antes de leer una línea completa.
