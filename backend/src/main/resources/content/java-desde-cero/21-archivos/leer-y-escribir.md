Los programas reales guardan datos entre ejecuciones: configuraciones, registros, exportaciones. La API moderna para archivos es `java.nio.file`, con dos protagonistas: `Path` (una ruta) y `Files` (las operaciones).

> [!analogia]
> Un `Path` es la dirección de una casa: dice dónde está, pero no abre la puerta ni mira dentro. `Files` es el cartero: con esa dirección puede dejar cartas (escribir), recogerlas (leer) o comprobar si la casa existe.

## Path

```java
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) {
        Path archivo = Path.of("datos", "notas.txt");
        System.out.println(archivo);                   // datos/notas.txt
        System.out.println(archivo.getFileName());     // notas.txt
        System.out.println(archivo.getParent());       // datos
        System.out.println(archivo.toAbsolutePath());  // ruta completa
    }
}
```

`Path.of` une las partes con el separador del sistema (`/` en Linux y macOS, `\` en Windows): no escribas los separadores a mano.

Las rutas **relativas** como `notas.txt` se resuelven desde el directorio de trabajo del programa. En esta plataforma cada ejecución tiene su propio directorio vacío y temporal: puedes crear archivos en él, pero desaparecen al terminar.

> [!cuidado]
> Crear un `Path` no crea ningún archivo. `Path.of("notas.txt")` solo apunta una dirección; el archivo existe cuando escribes en él con `Files`.

## Escribir y leer de una vez

Para archivos pequeños, `Files` lo hace en una línea:

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class Main {
    public static void main(String[] args) throws IOException {
        Path archivo = Path.of("saludo.txt");
        Files.writeString(archivo, "Hola\nArchivo\n");
        String contenido = Files.readString(archivo);
        System.out.print(contenido);

        Files.write(Path.of("lista.txt"), List.of("pan", "leche", "huevos"));
        List<String> lineas = Files.readAllLines(Path.of("lista.txt"));
        System.out.println(lineas.size() + " líneas: " + lineas);
    }
}
```

> [!prueba]
> Añade `"azúcar"` a la lista de la compra (`List.of("pan", "leche", "huevos", "azúcar")`) y ejecuta: ¿cuántas líneas dice ahora que tiene el archivo?

- `writeString` y `write` **crean** el archivo o **sobrescriben** su contenido.
- `readString` devuelve todo el texto; `readAllLines`, una lista con una entrada por línea.
- Todos usan UTF-8 por defecto.
- Pueden lanzar `IOException` (checked): aquí `main` la declara con `throws IOException` para simplificar; en un programa real, captúrala donde puedas informar del error.

## Añadir al final

Para no sobrescribir, pasa una opción:

> [!analogia]
> Escribir sin opciones es arrancar la hoja del cuaderno y empezar una nueva. `APPEND` es seguir escribiendo debajo de lo que ya había.

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class Main {
    public static void main(String[] args) throws IOException {
        Path registro = Path.of("registro.log");
        Files.writeString(registro, "inicio\n");
        Files.writeString(registro, "paso 1\n", StandardOpenOption.APPEND);
        Files.writeString(registro, "fin\n", StandardOpenOption.APPEND);
        System.out.print(Files.readString(registro));
    }
}
```

> [!prueba]
> Quita `, StandardOpenOption.APPEND` de la última escritura y ejecuta: ¿qué queda en el registro?

## Comprobar antes

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) throws IOException {
        Path archivo = Path.of("config.txt");
        System.out.println(Files.exists(archivo));
        Files.writeString(archivo, "modo=oscuro");
        System.out.println(Files.exists(archivo) + " " + Files.size(archivo) + " bytes");
        System.out.println(Files.isDirectory(archivo));
    }
}
```

> [!resumen]
> - `Path.of(...)` construye rutas portables; `Files` hace las operaciones.
> - `Files.writeString`/`write` escriben (sobrescribiendo); `readString`/`readAllLines` leen.
> - `StandardOpenOption.APPEND` añade al final.
> - Las operaciones de archivo lanzan `IOException`.
