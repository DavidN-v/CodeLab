**JUnit** es la biblioteca de pruebas estándar del ecosistema Java. En un proyecto real las pruebas viven en `src/test/java` y las ejecuta Maven o tu IDE con un clic. En esta plataforma JUnit está disponible y las lanzarás desde un `main`, como verás abajo.

## Tu primera clase de pruebas

```java fragment
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class CalculadoraTest {

    @Test
    void sumaDosNumerosPositivos() {
        Calculadora calculadora = new Calculadora();

        int resultado = calculadora.sumar(2, 3);

        assertEquals(5, resultado);
    }
}
```

- Cada método marcado con `@Test` es una prueba independiente.
- Por convención, la clase de pruebas se llama como la clase probada más `Test`.
- Nombra los métodos describiendo el comportamiento: `sumaDosNumerosPositivos`, `rechazaUnaNotaNegativa`.
- `assertEquals(esperado, obtenido)`: el **esperado va primero**. Si los inviertes, el mensaje de error confundirá.

## Las aserciones más usadas

| Aserción | Comprueba |
| --- | --- |
| `assertEquals(esperado, real)` | Que son iguales (con `equals`) |
| `assertEquals(0.3, real, 0.0001)` | Igualdad de decimales con tolerancia |
| `assertTrue(cond)` / `assertFalse(cond)` | Una condición |
| `assertNull(x)` / `assertNotNull(x)` | Nulos |
| `assertThrows(Tipo.class, () -> ...)` | Que el código lanza esa excepción |
| `assertAll(() -> ..., () -> ...)` | Varias comprobaciones, informando de todas las que fallen |

## Ejecutar las pruebas aquí

Este programa completo define una clase, sus pruebas, y un `main` que ejecuta las pruebas con el lanzador de JUnit y muestra un resumen. Ábrelo en el playground:

```java
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;

class Cuenta {
    private int saldo;

    Cuenta(int saldoInicial) {
        saldo = saldoInicial;
    }

    void retirar(int cantidad) {
        if (cantidad > saldo) {
            throw new IllegalStateException("Saldo insuficiente");
        }
        saldo -= cantidad;
    }

    int getSaldo() {
        return saldo;
    }
}

class CuentaTest {
    private Cuenta cuenta;

    @BeforeEach
    void crearCuenta() {
        cuenta = new Cuenta(100);   // cada prueba empieza con una cuenta nueva
    }

    @Test
    void retirarDescuentaDelSaldo() {
        cuenta.retirar(30);
        assertEquals(70, cuenta.getSaldo());
    }

    @Test
    void sePuedeRetirarTodo() {
        cuenta.retirar(100);
        assertTrue(cuenta.getSaldo() == 0);
    }

    @Test
    void noSePuedeRetirarMasDeLoQueHay() {
        assertThrows(IllegalStateException.class, () -> cuenta.retirar(101));
        assertEquals(100, cuenta.getSaldo());
    }
}

public class Main {
    public static void main(String[] args) {
        var peticion = LauncherDiscoveryRequestBuilder.request().selectors(selectClass(CuentaTest.class)).build();
        var resumen = new SummaryGeneratingListener();
        LauncherFactory.create().execute(peticion, resumen);
        var resultado = resumen.getSummary();
        System.out.println(resultado.getTestsSucceededCount() + "/" + resultado.getTestsFoundCount() + " pruebas superadas");
        resultado.getFailures().forEach(fallo -> System.out.println("FALLA " + fallo.getTestIdentifier().getDisplayName()
                + ": " + fallo.getException().getMessage()));
    }
}
```

Cambia algo en `Cuenta` (por ejemplo, quita la comprobación del saldo) y vuelve a ejecutar: verás qué prueba lo detecta.

## El ciclo de vida

- `@BeforeEach`: se ejecuta antes de **cada** prueba. Ideal para preparar un objeto nuevo, de modo que las pruebas no dependan unas de otras.
- `@AfterEach`: después de cada prueba (liberar recursos).
- `@BeforeAll` / `@AfterAll`: una vez para toda la clase (métodos `static`).

> **Las pruebas deben ser independientes.** JUnit no garantiza el orden en que las ejecuta; si una depende del estado que dejó otra, fallará de forma aleatoria.

## Probar excepciones

`assertThrows` ejecuta la lambda y comprueba que lanza la excepción esperada. Además devuelve la excepción, para revisar su mensaje:

```java fragment
IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
        () -> new Fraccion(1, 0));
assertEquals("Denominador cero", error.getMessage());
```

## Resumen

- Cada `@Test` es una prueba independiente; nómbrala por el comportamiento.
- `assertEquals(esperado, real)`, `assertTrue`, `assertThrows` y compañía.
- `@BeforeEach` prepara un estado limpio para cada prueba.
- Aquí las lanzas desde `main` con `LauncherFactory`; en un proyecto, con Maven o el IDE.
