Vas a equivocarte muchas veces, y está bien: los errores son la forma en que el compilador y la JVM te dicen qué esperaban. Aprender a leerlos te ahorra horas.

## Dos momentos, dos tipos de error

| Tipo | Cuándo | Quién lo detecta | ¿Se ejecuta algo? |
| --- | --- | --- | --- |
| **De compilación** | Al traducir el código | `javac` | No: el programa no llega a arrancar |
| **De ejecución** (excepciones) | Mientras el programa corre | La JVM | Sí, hasta el punto del error |

Hay un tercer tipo, el más traicionero: el **error lógico**. El programa compila y termina sin quejarse, pero hace otra cosa de la que querías. Contra esos te protegen los tests de los ejercicios.

## Leer un error de compilación

```java error
public class Main {
    public static void main(String[] args) {
        System.out.println("Hola")
    }
}
```

Al ejecutar, la consola muestra:

```
Main.java:3: error: ';' expected
        System.out.println("Hola")
                                  ^
1 error
```

- `Main.java:3` → archivo y **línea** del problema.
- `error: ';' expected` → qué esperaba el compilador.
- La flecha `^` señala la posición exacta.

Algunos mensajes frecuentes:

| Mensaje | Causa habitual |
| --- | --- |
| `';' expected` | Falta un punto y coma |
| `cannot find symbol` | Nombre mal escrito (mayúsculas incluidas) o variable no declarada |
| `class X is public, should be declared in a file named X.java` | El nombre del archivo no coincide con la clase pública |
| `incompatible types` | Guardas un valor de un tipo en una variable de otro |
| `reached end of file while parsing` | Falta una llave `}` de cierre |
| `unclosed string literal` | Falta la comilla de cierre de un texto |

> **Consejo:** corrige siempre **el primer error** de la lista y vuelve a compilar. Un solo fallo (una llave que falta) puede provocar diez mensajes en cascada que desaparecen al arreglarlo.

## Leer un error de ejecución

```java
public class Main {
    public static void main(String[] args) {
        int total = 10;
        int personas = 0;
        System.out.println("Antes de dividir");
        System.out.println(total / personas);
        System.out.println("Esto no se imprime");
    }
}
```

```
Antes de dividir
Exception in thread "main" java.lang.ArithmeticException: / by zero
	at Main.main(Main.java:6)
```

- `ArithmeticException` es el **tipo** de excepción; `/ by zero`, el detalle.
- La línea `at Main.main(Main.java:6)` es la **traza** (*stack trace*): dónde ocurrió. Cuando haya varios métodos, verás varias líneas `at`; la primera es donde saltó el error.
- Todo lo anterior al error sí se ejecutó.

Otras excepciones que verás pronto:

| Excepción | Causa habitual |
| --- | --- |
| `InputMismatchException` | `nextInt()` encontró algo que no es un número |
| `NoSuchElementException` | Intentaste leer más entrada de la que había |
| `ArrayIndexOutOfBoundsException` | Accediste a una posición que no existe en un array |
| `NullPointerException` | Usaste una referencia que vale `null` |

## Cuando se acaba el tiempo

Cada ejecución tiene un límite de tiempo. Si tu programa entra en un bucle infinito, la plataforma lo detiene y verás **Tiempo agotado**. Revisa la condición de tus bucles.

## Resumen

- Los errores de compilación indican archivo, línea y qué se esperaba: arregla el primero.
- Las excepciones indican tipo, detalle y línea en la traza `at ...`.
- Un programa que no falla también puede estar mal: los tests te lo dirán.
