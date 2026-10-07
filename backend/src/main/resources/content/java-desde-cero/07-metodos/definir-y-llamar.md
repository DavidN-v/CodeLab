A medida que un programa crece, meterlo todo en `main` se vuelve inmanejable. Un **método** es un bloque de código con nombre que puedes ejecutar (llamar) tantas veces como quieras.

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

## Con parámetros

Los **parámetros** son variables que el método recibe al ser llamado:

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

## Con valor de retorno

Un método puede calcular algo y **devolverlo** con `return`. En lugar de `void`, se indica el tipo del resultado:

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

## Por qué usar métodos

- **Reutilizar:** escribes la lógica una vez y la llamas donde haga falta.
- **Dar nombre:** `esPrimo(n)` se entiende mejor que diez líneas de bucle.
- **Probar por partes:** cada método se puede comprobar por separado.
- **Cambiar en un solo sitio:** si la regla cambia, se corrige una vez.

> **Regla práctica:** un método debería hacer **una sola cosa** y su nombre debería decir cuál. Si te cuesta ponerle nombre, probablemente hace demasiado.

## Resumen

- `static tipo nombre(parámetros) { ... }` declara un método.
- `void` si no devuelve nada; si devuelve, `return valor;` en todos los caminos.
- Los argumentos se asignan a los parámetros en orden.
- Métodos cortos, con un nombre que diga lo que hacen.
