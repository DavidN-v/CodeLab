Casi todos los programas de este curso se comunican contigo a través de la **consola**: el panel de texto donde aparece lo que tu programa escribe. Vamos a ver cómo escribir en ella con soltura.

## print y println

`println` escribe y salta de línea; `print` escribe y se queda en la misma línea:

```java
public class Main {
    public static void main(String[] args) {
        System.out.print("Hola, ");
        System.out.print("mundo");
        System.out.println("!");
        System.out.println("Esta línea va debajo.");
    }
}
```

Salida:

```
Hola, mundo!
Esta línea va debajo.
```

> [!analogia]
> Piensa en una máquina de escribir. `print` escribe y deja el carro donde está; `println` escribe y además pulsa **Intro**, así que lo siguiente empieza en una línea nueva.

`System.out.println()` sin nada dentro imprime una línea en blanco.

> [!prueba]
> Cambia el primer `print` por `println` y vuelve a ejecutar. ¿En cuántas líneas sale ahora el saludo?

## Unir textos con +

El operador `+` une (**concatena**) textos. Si uno de los lados es un número, también lo convierte en texto:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Java " + "21");
        System.out.println("Tengo " + 3 + " gatos");
        System.out.println("1 + 2 = " + (1 + 2));
        System.out.println("1 + 2 = " + 1 + 2);
    }
}
```

> [!analogia]
> Concatenar es como unir vagones de tren: `"Tengo "` + `3` + `" gatos"` engancha tres vagones en uno solo, `"Tengo 3 gatos"`.

La última línea imprime `1 + 2 = 12`. Java lee de izquierda a derecha: primero une `"1 + 2 = "` con `1`, y luego el resultado (ya un texto) con `2`. Los paréntesis de la línea anterior obligan a sumar primero.

> [!cuidado]
> Los espacios dentro de las comillas cuentan. `"Tengo" + 3` imprime `Tengo3`, todo pegado. Si quieres un espacio, ponlo tú: `"Tengo " + 3`.

## Secuencias de escape

Algunos caracteres no se pueden escribir tal cual dentro de unas comillas. Se escriben con una barra invertida `\` delante:

| Secuencia | Resultado |
| --- | --- |
| `\n` | Salto de línea |
| `\t` | Tabulador |
| `\"` | Comilla doble |
| `\\` | Barra invertida |

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Ella dijo: \"Hola\"");
        System.out.println("Línea 1\nLínea 2");
        System.out.println("Nombre\tEdad");
        System.out.println("C:\\Usuarios\\ada");
    }
}
```

> [!analogia]
> La barra `\` es como decir "ojo, lo siguiente es especial". `\"` significa "una comilla que forma parte del texto, no la que lo cierra".

## Comentarios

Los **comentarios** son notas para personas; el compilador los ignora.

```java
public class Main {
    // Comentario de una línea
    public static void main(String[] args) {
        /*
         * Comentario de varias líneas.
         * Útil para explicar un bloque entero.
         */
        System.out.println("Los comentarios no se imprimen"); // también al final de una línea
    }
}
```

Comenta el **porqué**, no el qué: `// sumamos 1 a i` no aporta nada; `// el primer día del mes es el 1, no el 0` sí.

> [!idea]
> El corrector de los ejercicios compara tu salida carácter a carácter (ignorando solo los espacios al final de cada línea). Un espacio de más, una mayúscula distinta o un punto que falta hacen que no coincida.

> [!resumen]
> - `print` no salta de línea; `println` sí.
> - `+` concatena textos y convierte números en texto, de izquierda a derecha.
> - `\n`, `\t`, `\"` y `\\` escriben caracteres especiales.
> - Los comentarios (`//` y `/* */`) son notas que Java ignora.
