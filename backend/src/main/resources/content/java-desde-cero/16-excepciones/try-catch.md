Una **excepción** es un evento que interrumpe el flujo normal del programa: dividir entre cero, leer un número que no es un número, acceder fuera de un array. Si nadie la trata, el programa termina con una traza de error. Con `try`/`catch` puedes **capturarla** y reaccionar.

## Capturar una excepción

```java
public class Main {
    public static void main(String[] args) {
        String[] entradas = {"42", "hola", "7"};
        for (String texto : entradas) {
            try {
                int numero = Integer.parseInt(texto);
                System.out.println("Doble: " + numero * 2);
            } catch (NumberFormatException e) {
                System.out.println("'" + texto + "' no es un número");
            }
        }
        System.out.println("El programa sigue");
    }
}
```

- El código que puede fallar va en el bloque `try`.
- Si se lanza una excepción, la ejecución **salta** al `catch` cuyo tipo coincida; el resto del `try` no se ejecuta.
- Después del `catch`, el programa continúa con normalidad.
- Si no hay excepción, el `catch` se ignora.

## El objeto excepción

La variable del `catch` (`e`) es un objeto con información sobre el error:

```java
public class Main {
    public static void main(String[] args) {
        try {
            int[] datos = new int[3];
            datos[5] = 1;
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Mensaje: " + e.getMessage());
            System.out.println("Tipo: " + e.getClass().getSimpleName());
        }
    }
}
```

`e.printStackTrace()` imprime la traza completa, útil para depurar.

## Varios catch

Un `try` puede tener varios `catch`, que se comprueban en orden:

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
        try {
            int a = Integer.parseInt(entrada.nextLine().trim());
            int b = Integer.parseInt(entrada.nextLine().trim());
            System.out.println(a / b);
        } catch (NumberFormatException e) {
            System.out.println("Escribe números enteros");
        } catch (ArithmeticException e) {
            System.out.println("No se puede dividir entre cero");
        }
    }
}
```

Si dos tipos se tratan igual, puedes unirlos: `catch (NumberFormatException | ArithmeticException e)`.

> **Orden:** pon los tipos más específicos antes que los generales. Un `catch (Exception e)` primero capturaría todo y los siguientes nunca se alcanzarían (de hecho, el compilador no lo permite).

## Lo que no hay que hacer

```java fragment
try {
    procesar();
} catch (Exception e) {
    // vacío: el error desaparece en silencio
}
```

Un `catch` vacío esconde los errores: el programa sigue como si nada y falla más tarde, lejos de la causa real. Si capturas, **haz algo**: informa, usa un valor alternativo, reintenta o vuelve a lanzar.

Tampoco uses excepciones para el flujo normal. Si puedes comprobar algo antes (`if (divisor != 0)`), hazlo: es más claro y más rápido.

## Resumen

- `try { ... } catch (Tipo e) { ... }` captura la excepción y deja continuar el programa.
- Al lanzarse, el resto del `try` se salta y se ejecuta el `catch` que coincida.
- Varios `catch`, de lo más específico a lo más general; `|` para tratar varios igual.
- Nunca dejes un `catch` vacío.
