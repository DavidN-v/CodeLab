A medida que un programa crece, meterlo todo en `main` se vuelve inmanejable. Un **método** es un bloque de código con nombre que puedes ejecutar (llamar) tantas veces como quieras.

> [!analogia]
> Un método es como una receta de cocina. La escribes una vez con un nombre («tortilla») y, cada vez que quieres una, solo dices «haz una tortilla». No vuelves a explicar todos los pasos.

## Tu primer método

```java
public class Main {
    static void saludar() {
        System.out.println("¡Hola!");
        System.out.println("Bienvenido a Forja.");
    }

    public static void main(String[] args) {
        saludar();
        System.out.println("---");
        saludar();
    }
}
```

- Se declara **dentro de la clase** pero **fuera de `main`**.
- `static` permite llamarlo desde `main` sin crear objetos (en el módulo de Clases verás métodos sin `static`).
- `void` indica que no devuelve nada.
- Se llama escribiendo su nombre seguido de paréntesis: `saludar();`.

Cuando Java encuentra una llamada, salta al método, ejecuta su cuerpo y vuelve justo después de la llamada.

> [!prueba]
> Añade una tercera llamada `saludar();` al final de `main` y vuelve a ejecutar: ¿cuántas veces aparece ahora «Bienvenido a Forja.»?

> [!cuidado]
> Si escribes un método **dentro** de `main`, el programa no compila. Cada método va suelto dentro de la clase, uno detrás de otro.

## Con parámetros

Los **parámetros** son variables que el método recibe al ser llamado:

> [!analogia]
> Los parámetros son los ingredientes que le das a la receta. La receta «saludar» es siempre la misma, pero puedes darle un nombre distinto cada vez.

```java
public class Main {
    static void saludar(String nombre, int veces) {
        for (int i = 0; i < veces; i++) {
            System.out.println("Hola, " + nombre);
        }
    }

    public static void main(String[] args) {
        saludar("Ada", 2);
        saludar("Grace", 1);
    }
}
```

Los valores que pasas en la llamada (`"Ada"`, `2`) se llaman **argumentos**. Se asignan a los parámetros en orden, y deben coincidir en número y tipo.

> [!prueba]
> Cambia `saludar("Grace", 1);` por `saludar(1, "Grace");` y ejecuta: ¿qué error da? El orden importa.

## Con valor de retorno

Un método puede calcular algo y **devolverlo** con `return`. En lugar de `void`, se indica el tipo del resultado:

> [!analogia]
> Un método con `return` es como una máquina de zumos: le das naranjas (los argumentos) y te devuelve un vaso de zumo (el resultado), que puedes beberte, guardar o mezclar con otra cosa.

```java
public class Main {
    static int cuadrado(int n) {
        return n * n;
    }

    static double media(int a, int b) {
        return (a + b) / 2.0;
    }

    public static void main(String[] args) {
        int x = cuadrado(7);
        System.out.println(x);
        System.out.println(cuadrado(3) + cuadrado(4));
        System.out.println(media(5, 8));
    }
}
```

La llamada `cuadrado(7)` **es** una expresión que vale 49: puedes guardarla, imprimirla o usarla dentro de otra cuenta.

`return` termina el método en ese mismo momento. Si el método no es `void`, todo camino posible debe acabar en un `return`, o no compila:

```java
public class Main {
    static String clasificar(int n) {
        if (n > 0) {
            return "positivo";
        } else if (n < 0) {
            return "negativo";
        }
        return "cero";
    }

    public static void main(String[] args) {
        System.out.println(clasificar(-4));
    }
}
```

> [!cuidado]
> Llamar a un método que devuelve algo y no usar el resultado no da error, pero el valor se pierde: `cuadrado(7);` solo, en una línea, calcula 49 y lo tira.

## Por qué usar métodos

- **Reutilizar:** escribes la lógica una vez y la llamas donde haga falta.
- **Dar nombre:** `esPrimo(n)` se entiende mejor que diez líneas de bucle.
- **Probar por partes:** cada método se puede comprobar por separado.
- **Cambiar en un solo sitio:** si la regla cambia, se corrige una vez.

> [!idea]
> Un método debería hacer **una sola cosa** y su nombre debería decir cuál. Si te cuesta ponerle nombre, probablemente hace demasiado.

> [!resumen]
> - `static tipo nombre(parámetros) { ... }` declara un método.
> - `void` si no devuelve nada; si devuelve, `return valor;` en todos los caminos.
> - Los argumentos se asignan a los parámetros en orden.
> - Métodos cortos, con un nombre que diga lo que hacen.
