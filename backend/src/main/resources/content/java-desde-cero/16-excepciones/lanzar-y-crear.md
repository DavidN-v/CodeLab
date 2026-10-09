## throw

Hasta ahora has capturado excepciones que lanzaba Java. Tu código también puede **lanzar** las suyas, normalmente para rechazar datos inválidos:

> [!analogia]
> `throw` es el árbitro que pita falta: detiene el juego en ese momento y explica por qué. Quien esté preparado (un `catch`) decide cómo seguir.

```java
public class Main {
    static double raizCuadrada(double x) {
        if (x < 0) {
            throw new IllegalArgumentException("No hay raíz real de " + x);
        }
        return Math.sqrt(x);
    }

    public static void main(String[] args) {
        System.out.println(raizCuadrada(16));
        try {
            raizCuadrada(-4);
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
```

> [!prueba]
> Cambia `raizCuadrada(-4)` por `raizCuadrada(25)` y ejecuta: no se lanza nada, así que el `catch` no imprime ningún error.

Las dos que más usarás:

- `IllegalArgumentException`: un argumento no es válido.
- `IllegalStateException`: el objeto no está en un estado que permita la operación (retirar de una cuenta cerrada).

> [!idea]
> Falla **pronto** y con un mensaje claro: es mucho mejor que dejar pasar datos malos y fallar más tarde, lejos de la causa.

## Excepciones propias

Cuando el error es un concepto de tu dominio, crea tu propia excepción heredando de `RuntimeException` (o de `Exception` si quieres que sea checked):

> [!analogia]
> Es como tener un formulario de reclamación específico de tu tienda en vez de una hoja en blanco: dice exactamente qué ha pasado y trae los datos útiles (aquí, cuánto dinero falta).

```java
class SaldoInsuficienteException extends RuntimeException {
    private final double faltan;

    SaldoInsuficienteException(double faltan) {
        super("Saldo insuficiente: faltan " + faltan + " €");
        this.faltan = faltan;
    }

    double getFaltan() {
        return faltan;
    }
}

class Cuenta {
    private double saldo;

    Cuenta(double saldo) {
        this.saldo = saldo;
    }

    void retirar(double cantidad) {
        if (cantidad > saldo) {
            throw new SaldoInsuficienteException(cantidad - saldo);
        }
        saldo -= cantidad;
    }
}

public class Main {
    public static void main(String[] args) {
        Cuenta cuenta = new Cuenta(50);
        try {
            cuenta.retirar(80);
        } catch (SaldoInsuficienteException e) {
            System.out.println(e.getMessage());
            System.out.println("Faltan exactamente " + e.getFaltan());
        }
    }
}
```

`super(mensaje)` guarda el mensaje que devolverá `getMessage()`.

> [!cuidado]
> Olvidar la palabra `new` es un error típico: se escribe `throw new MiExcepcion(...)`, porque primero creas el objeto excepción y después lo lanzas.

## finally

El bloque `finally` se ejecuta **siempre**, haya excepción o no, incluso si el `try` hace `return`. Sirve para liberar recursos:

> [!analogia]
> `finally` es apagar la luz al salir de casa: da igual si has salido con prisa o tranquilo, siempre lo haces.

```java
public class Main {
    static int dividir(int a, int b) {
        try {
            return a / b;
        } catch (ArithmeticException e) {
            System.out.println("División entre cero");
            return 0;
        } finally {
            System.out.println("Operación terminada");
        }
    }

    public static void main(String[] args) {
        System.out.println(dividir(10, 2));
        System.out.println(dividir(1, 0));
    }
}
```

Fíjate en el orden de la salida: «Operación terminada» aparece **antes** que el 5, porque `finally` se ejecuta justo antes de que el método devuelva el valor.

Para archivos y conexiones existe una forma mejor, `try-with-resources`, que cierra los recursos automáticamente. La verás en el módulo de Archivos.

## Envolver excepciones

A veces capturas una excepción técnica y lanzas otra con más significado, conservando la original como **causa**:

```java fragment
try {
    return Integer.parseInt(texto);
} catch (NumberFormatException e) {
    throw new IllegalArgumentException("Edad no válida: " + texto, e);
}
```

La traza mostrará ambas, así no se pierde información.

> [!resumen]
> - `throw new TipoDeExcepcion("mensaje")` lanza una excepción; falla pronto y con mensaje claro.
> - Crea excepciones propias heredando de `RuntimeException` para errores de tu dominio.
> - `finally` se ejecuta siempre; úsalo para liberar recursos.
> - Al envolver una excepción, pasa la original como causa.
