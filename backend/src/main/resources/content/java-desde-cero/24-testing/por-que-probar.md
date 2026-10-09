Hasta ahora has comprobado tus programas ejecutándolos y mirando la salida. Funciona con programas pequeños, pero cada vez que cambias algo tendrías que volver a comprobarlo todo a mano. Las **pruebas automáticas** son código que comprueba tu código, y se ejecutan en segundos tantas veces como quieras.

> [!analogia]
> Una prueba automática es como la lista de comprobación de un piloto antes de despegar: en vez de confiar en la memoria, repasa los mismos puntos cada vez. Y como la lista la ejecuta el ordenador, repasarla cuesta segundos.

De hecho, llevas todo el curso usándolas: cada ejercicio se corrige ejecutando tu programa contra unos casos de prueba.

## Lo que aportan

- **Confianza para cambiar:** si las pruebas siguen pasando tras un cambio, no has roto lo que ya funcionaba.
- **Documentación viva:** una prueba muestra cómo se usa una clase y qué se espera de ella.
- **Mejor diseño:** el código difícil de probar suele estar mal diseñado (hace demasiadas cosas, depende de todo).
- **Errores encontrados antes:** cuanto antes aparece un fallo, más barato es arreglarlo.

## Una prueba sin bibliotecas

En el fondo, una prueba es: preparar datos, ejecutar el código y comprobar el resultado.

```java
class Calculadora {
    static int dividirRedondeando(int a, int b) {
        return Math.round((float) a / b);
    }
}

public class Main {
    static void comprobar(String nombre, int esperado, int obtenido) {
        System.out.println((esperado == obtenido ? "OK   " : "FALLA") + " " + nombre
                + (esperado == obtenido ? "" : " (esperado " + esperado + ", obtenido " + obtenido + ")"));
    }

    public static void main(String[] args) {
        comprobar("división exacta", 5, Calculadora.dividirRedondeando(10, 2));
        comprobar("redondea hacia arriba", 4, Calculadora.dividirRedondeando(7, 2));
        comprobar("redondea hacia abajo", 2, Calculadora.dividirRedondeando(7, 3));
        comprobar("negativos", -4, Calculadora.dividirRedondeando(-7, 2));
    }
}
```

Ejecútalo: la última prueba falla. Esperábamos `-4` (redondear -3,5 «alejándose del cero»), pero `Math.round(-3.5)` da `-3`, porque redondea las mitades hacia arriba. ¿Está mal el código o lo que está mal es la expectativa? Eso también es útil: una prueba que falla te obliga a decidir cuál es el comportamiento correcto.

> [!prueba]
> Cambia el esperado de la prueba «negativos» de `-4` a `-3` y vuelve a ejecutar: ahora pasan todas. Después cambia `Math.round((float) a / b)` por `a / b` (división entera, sin redondear): ¿qué prueba falla ahora?

## Arrange, Act, Assert

Toda prueba bien escrita tiene tres partes, a menudo separadas por una línea en blanco:

> [!analogia]
> Es como probar una receta: **preparas** los ingredientes, **cocinas** el plato y **pruebas** si sabe como esperabas.

1. **Arrange (preparar):** crear los objetos y datos necesarios.
2. **Act (actuar):** ejecutar **una** operación, la que se prueba.
3. **Assert (comprobar):** verificar el resultado.

```java fragment
// Arrange
Cuenta cuenta = new Cuenta(100);

// Act
boolean hecha = cuenta.retirar(30);

// Assert
assertTrue(hecha);
assertEquals(70, cuenta.getSaldo());
```

## ¿Qué casos probar?

No se puede probar todo, así que hay que elegir bien:

- **El caso normal:** el uso típico.
- **Los bordes:** 0, 1, el máximo, la lista vacía, el texto vacío, el último elemento.
- **Los errores:** datos inválidos, ¿se rechazan como deben?
- **Lo que ya falló una vez:** cada bug corregido merece una prueba que impida que vuelva.

Para una función que dice si un año es bisiesto: un año normal (2023), uno divisible entre 4 (2024), uno entre 100 (1900) y uno entre 400 (2000). Cuatro pruebas cubren las cuatro reglas.

> [!cuidado]
> Probar solo el caso «normal» es el error más común. Los fallos suelen esconderse en los bordes: la lista vacía, el 0, el último elemento.

> [!resumen]
> - Las pruebas automáticas comprueban tu código en segundos, cada vez que lo cambias.
> - Cada prueba: preparar, actuar, comprobar.
> - Prueba el caso normal, los bordes, los errores y los fallos ya conocidos.
