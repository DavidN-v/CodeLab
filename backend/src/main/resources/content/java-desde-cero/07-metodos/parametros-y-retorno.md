## Paso por valor

En Java, al llamar a un método se pasa una **copia** del valor de cada argumento. Si el método modifica su parámetro, la variable original no cambia:

```java
public class Main {
    static void duplicar(int n) {
        n = n * 2;
        System.out.println("Dentro: " + n);
    }

    public static void main(String[] args) {
        int numero = 5;
        duplicar(numero);
        System.out.println("Fuera: " + numero);
    }
}
```

Imprime `Dentro: 10` y `Fuera: 5`. Si quieres el valor nuevo, **devuélvelo** y asígnalo: `numero = duplicar(numero);`.

> Con objetos y arrays se copia la *referencia* (la dirección del objeto), así que un método sí puede modificar el contenido de un array que recibe. Lo verás en el módulo de Arrays.

## Variables locales

Las variables declaradas dentro de un método (incluidos sus parámetros) son **locales**: nacen al llamarlo y desaparecen al terminar. Dos métodos pueden tener variables con el mismo nombre sin interferir:

```java
public class Main {
    static int sumar(int a, int b) {
        int resultado = a + b;
        return resultado;
    }

    public static void main(String[] args) {
        int resultado = sumar(2, 3) * 10;   // otra variable distinta
        System.out.println(resultado);
    }
}
```

## Sobrecarga

Varios métodos pueden llamarse igual si sus parámetros son distintos (en número o en tipo). Java elige cuál ejecutar según los argumentos:

```java
public class Main {
    static int area(int lado) {
        return lado * lado;
    }

    static int area(int ancho, int alto) {
        return ancho * alto;
    }

    static double area(double radio) {
        return Math.PI * radio * radio;
    }

    public static void main(String[] args) {
        System.out.println(area(4));
        System.out.println(area(3, 5));
        System.out.printf("%.2f%n", area(1.5));
    }
}
```

`System.out.println` es el ejemplo más conocido: hay una versión para `int`, otra para `String`, otra para `double`… Por eso acepta casi cualquier cosa.

El tipo de retorno **no** cuenta para la sobrecarga: dos métodos que solo se diferencian en lo que devuelven no compilan.

## Métodos que llaman a métodos

Los métodos se combinan para construir otros más grandes:

```java
public class Main {
    static boolean esPar(int n) {
        return n % 2 == 0;
    }

    static int contarPares(int desde, int hasta) {
        int cuenta = 0;
        for (int i = desde; i <= hasta; i++) {
            if (esPar(i)) {
                cuenta++;
            }
        }
        return cuenta;
    }

    public static void main(String[] args) {
        System.out.println(contarPares(1, 10));
    }
}
```

Fíjate en que `esPar` devuelve directamente la condición, en vez de `if (n % 2 == 0) return true; else return false;`.

## Documentar un método

Para métodos importantes, un comentario `/** ... */` (Javadoc) explica qué hace, qué recibe y qué devuelve:

```java fragment
/**
 * Calcula el precio final aplicando un descuento.
 * @param precio precio original, en euros
 * @param porcentaje descuento entre 0 y 100
 * @return el precio con el descuento aplicado
 */
static double aplicarDescuento(double precio, double porcentaje) {
    return precio * (1 - porcentaje / 100);
}
```

## Resumen

- Java pasa los argumentos **por valor**: el método recibe copias.
- Las variables de un método son locales a él.
- La sobrecarga permite varios métodos con el mismo nombre y distintos parámetros.
- Construye métodos grandes combinando métodos pequeños.
