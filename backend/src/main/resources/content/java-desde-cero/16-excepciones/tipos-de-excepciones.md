## La jerarquía

Las excepciones son objetos, y sus clases forman un árbol familiar. Todas heredan de `Throwable` (en inglés, «que se puede lanzar»):

```
Throwable
├── Error                        problemas graves de la JVM: no se capturan
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception
    ├── IOException              checked
    ├── SQLException             checked
    └── RuntimeException         unchecked
        ├── NullPointerException
        ├── ArithmeticException
        ├── IllegalArgumentException
        │   └── NumberFormatException
        ├── IllegalStateException
        └── IndexOutOfBoundsException
```

Como son clases, un `catch (IllegalArgumentException e)` también captura sus subclases, como `NumberFormatException`.

> [!analogia]
> Es como un servicio de urgencias. Si el cartel dice «Atendemos lesiones», también atiende un esguince o una fractura, porque son tipos de lesión. Un `catch` de una clase atiende a toda su familia de debajo.

## Checked y unchecked

Java distingue dos familias:

| | Checked | Unchecked |
| --- | --- | --- |
| Heredan de | `Exception` (pero no de `RuntimeException`) | `RuntimeException` |
| ¿Obligatorio tratarlas? | Sí: capturarlas o declararlas con `throws` | No |
| Representan | Problemas externos que pueden pasar aunque el código sea correcto (un archivo que no existe, la red caída) | Errores de programación o datos inválidos (un `null`, un índice mal calculado) |

> [!analogia]
> Una excepción checked es como la lluvia el día de una excursión: no es culpa tuya, pero el compilador te obliga a llevar paraguas (un plan). Una unchecked es como tropezar por no mirar: no hace falta un plan, hace falta mirar mejor (corregir el código).

Si llamas a un método que lanza una checked exception, el compilador te obliga a decidir qué hacer:

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) {
        try {
            String contenido = Files.readString(Path.of("no-existe.txt"));
            System.out.println(contenido);
        } catch (IOException e) {
            System.out.println("No se pudo leer: " + e.getClass().getSimpleName());
        }
    }
}
```

Sin el `try`, `Files.readString` no compila: "unreported exception IOException; must be caught or declared to be thrown". Lo verás mucho en el módulo de Archivos.

> [!prueba]
> Cambia `catch (IOException e)` por `catch (Exception e)` y ejecuta: sigue funcionando, porque `IOException` es una subclase de `Exception`. El mensaje muestra el tipo concreto que se lanzó.

## Propagar con throws

Si un método no sabe cómo tratar una checked exception, puede **declararla** con `throws` y dejar que la trate quien lo llamó:

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    static int contarLineas(String ruta) throws IOException {
        return Files.readAllLines(Path.of(ruta)).size();
    }

    public static void main(String[] args) {
        try {
            System.out.println(contarLineas("datos.txt"));
        } catch (IOException e) {
            System.out.println("Archivo no disponible");
        }
    }
}
```

Las excepciones **suben** por la pila de llamadas hasta que alguien las captura. Si llegan a `main` y tampoco las captura, el programa termina mostrando la traza.

> [!cuidado]
> No confundas `throws` (con «s», en la firma del método: «esto puede lanzar…») con `throw` (sin «s», dentro del código: «lanza esto ahora»). Lo verás en la siguiente lección.

## ¿Dónde capturar?

Captura donde **puedas hacer algo útil**: mostrar un mensaje al usuario, usar un valor por defecto, reintentar. Si en un método intermedio no tienes nada sensato que hacer, deja que la excepción suba.

> [!resumen]
> - Toda excepción hereda de `Throwable`; los `Error` no se capturan.
> - Checked (`IOException`…): el compilador obliga a capturarlas o declararlas.
> - Unchecked (`RuntimeException` y subclases): errores de programación o datos inválidos.
> - `throws` en la firma deja que la excepción suba al llamador.
