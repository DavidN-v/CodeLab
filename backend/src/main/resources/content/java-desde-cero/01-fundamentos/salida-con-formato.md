Con `+` puedes construir cualquier texto, pero a veces se vuelve un lío de comillas y espacios. `printf` te deja escribir primero la frase completa y decir después qué valores van en cada hueco.

## printf: una plantilla con huecos

`printf` usa una plantilla con **marcadores** (los huecos, que empiezan por `%`) que se sustituyen por valores, en orden:

```java
public class Main {
    public static void main(String[] args) {
        System.out.printf("%s tiene %d años%n", "Ada", 36);
        System.out.printf("Precio: %.2f euros%n", 3.14159);
        System.out.printf("|%5d|%-5d|%n", 42, 42);
    }
}
```

Salida:

```
Ada tiene 36 años
Precio: 3.14 euros
|   42|42   |
```

> [!analogia]
> `printf` es como un formulario con huecos: "___ tiene ___ años". Primero escribes el formulario y después, en orden, lo que va en cada hueco. `%s` es un hueco para texto y `%d` uno para un número entero.

| Marcador | Para |
| --- | --- |
| `%s` | Texto |
| `%d` | Números enteros |
| `%f` | Decimales; `%.2f` con dos decimales |
| `%n` | Salto de línea |
| `%5d` / `%-5d` | Ancho mínimo de 5, alineado a la derecha / izquierda |

> [!prueba]
> En la segunda línea, cambia `%.2f` por `%.4f` y vuelve a ejecutar. ¿Cuántos decimales salen ahora?

## El salto de línea lo pones tú

A diferencia de `println`, `printf` **no** añade el salto de línea al final: tienes que poner `%n` tú.

```java
public class Main {
    public static void main(String[] args) {
        System.out.printf("Uno ");
        System.out.printf("Dos%n");
        System.out.printf("Tres%n");
    }
}
```

Imprime `Uno Dos` en una línea y `Tres` en la siguiente.

> [!cuidado]
> Cada hueco necesita un valor del tipo correcto. `printf("%d", 3.5)` falla al ejecutarse con una `IllegalFormatConversionException`, porque `%d` espera un entero y `3.5` es decimal. Para decimales usa `%f` o `%.2f`.

## printf redondea

`%.2f` no corta los decimales, **redondea**: `3.14159` se muestra como `3.14` y `2.678` como `2.68`. El valor guardado no cambia; solo cambia cómo se escribe.

> [!idea]
> Usa `println` con `+` para mensajes sencillos y `printf` cuando quieras controlar decimales o alinear columnas.

> [!resumen]
> - `printf` usa una plantilla con huecos: `%s` texto, `%d` enteros, `%.2f` decimales.
> - Los valores se colocan en los huecos en el mismo orden en que los escribes.
> - `printf` no salta de línea: añade `%n` al final.
