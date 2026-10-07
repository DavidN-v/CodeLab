Un programa no solo lee y escribe archivos sueltos: también organiza carpetas, recorre lo que hay dentro y hace limpieza. `Files` tiene una operación para cada cosa.

> [!analogia]
> Las carpetas son cajones dentro de cajones de un armario. Una ruta como `proyecto/src/main` dice "armario proyecto, cajón src, cajoncito main". `Files` es quien abre, crea, vacía o cambia de sitio esos cajones.

## Crear directorios

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path carpeta = Path.of("proyecto", "src", "main");
        Files.createDirectories(carpeta);    // crea también las intermedias
        Files.writeString(carpeta.resolve("App.java"), "class App {}");
        System.out.println(Files.isDirectory(carpeta));
        System.out.println(Files.exists(Path.of("proyecto/src/main/App.java")));
    }
}
```

`createDirectory` crea solo una carpeta y falla si su padre no existe; `createDirectories` crea toda la ruta y no falla si ya existe. `resolve` añade un nombre a una ruta.

> [!prueba]
> Cambia `Files.createDirectories(carpeta)` por `Files.createDirectory(carpeta)` y ejecuta: ¿qué excepción aparece y por qué?

## Listar y recorrer

> [!analogia]
> `Files.list` es abrir un cajón y mirar lo que hay encima. `Files.walk` es vaciar el armario entero, cajón por cajón, incluidos los cajoncitos de dentro.

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

public class Main {
    public static void main(String[] args) throws IOException {
        Files.createDirectories(Path.of("fotos/2025"));
        Files.createDirectories(Path.of("fotos/2026"));
        Files.writeString(Path.of("fotos/2025/playa.jpg"), "...");
        Files.writeString(Path.of("fotos/2026/nieve.jpg"), "...");
        Files.writeString(Path.of("fotos/leeme.txt"), "...");

        try (Stream<Path> hijos = Files.list(Path.of("fotos"))) {        // un nivel
            hijos.sorted().forEach(p -> System.out.println("list: " + p));
        }
        try (Stream<Path> todo = Files.walk(Path.of("fotos"))) {         // todos los niveles
            todo.filter(Files::isRegularFile)
                .sorted()
                .forEach(p -> System.out.println("walk: " + p));
        }
    }
}
```

`Files.list` y `Files.walk` devuelven streams que hay que cerrar. El orden en que el sistema devuelve los archivos no está garantizado: ordénalos si te importa.

> [!cuidado]
> Si quitas el `.sorted()`, el programa puede funcionar en tu ordenador y dar otro orden en otro. No confíes en el orden del sistema de archivos.

## Copiar, mover y borrar

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class Main {
    public static void main(String[] args) throws IOException {
        Path original = Path.of("informe.txt");
        Files.writeString(original, "versión 1");
        Files.copy(original, Path.of("copia.txt"));
        Files.move(Path.of("copia.txt"), Path.of("archivo.txt"), StandardCopyOption.REPLACE_EXISTING);
        System.out.println(Files.readString(Path.of("archivo.txt")));
        Files.delete(original);                                   // falla si no existe
        System.out.println(Files.deleteIfExists(original));       // false: ya no estaba
    }
}
```

`Files.delete` no borra carpetas con contenido; para eso hay que borrar primero lo de dentro (por ejemplo, recorriendo con `walk` en orden inverso).

## Errores típicos

| Excepción | Causa |
| --- | --- |
| `NoSuchFileException` | El archivo o la carpeta no existe |
| `FileAlreadyExistsException` | Crear o copiar sobre algo que ya existe |
| `DirectoryNotEmptyException` | Borrar una carpeta con contenido |
| `AccessDeniedException` | Sin permisos |

Todas heredan de `IOException`.

> [!resumen]
> - `createDirectories` crea rutas completas; `resolve` construye rutas hijas.
> - `Files.list` recorre un nivel y `Files.walk` todos; ciérralos y ordénalos.
> - `copy`, `move`, `delete` y `deleteIfExists` para gestionar archivos.
