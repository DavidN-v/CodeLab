## Paso por valor

En Java, al llamar a un método se pasa una **copia** del valor de cada argumento. Si el método modifica su parámetro, la variable original no cambia:

> [!analogia]
> Es como darle a alguien una fotocopia de tu examen. Puede tachar y escribir lo que quiera en la fotocopia: tu original sigue intacto.

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

Imprime `Dentro: 10` y `Fuera: 5`. Mientras `duplicar` se ejecuta, cada método tiene su propio marco en la pila con sus propias variables:

```memoria
stack main
numero: 5
stack duplicar
n: 10
```

Si quieres el valor nuevo, **devuélvelo** y asígnalo: `numero = duplicar(numero);`.

> [!prueba]
> Cambia el método para que sea `static int duplicar(int n)`, añade `return n;` al final y en `main` escribe `numero = duplicar(numero);`. Ejecuta: ¿qué imprime ahora «Fuera»?

> [!idea]
> Con objetos y arrays se copia la *referencia* (la dirección del objeto), así que un método sí puede modificar el contenido de un array que recibe. Lo verás en el módulo de Arrays.

## Variables locales

Las variables declaradas dentro de un método (incluidos sus parámetros) son **locales**: nacen al llamarlo y desaparecen al terminar. Dos métodos pueden tener variables con el mismo nombre sin interferir:

> [!analogia]
> Cada método es una habitación con su propia pizarra. Que en dos habitaciones haya una pizarra que pone «resultado» no las convierte en la misma pizarra.

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

> [!cuidado]
> Desde `main` no puedes usar `a` ni `b`: solo existen dentro de `sumar`. Si lo intentas, verás el error `cannot find symbol`.

## Sobrecarga

Varios métodos pueden llamarse igual si sus parámetros son distintos (en número o en tipo). Java elige cuál ejecutar según los argumentos:

> [!analogia]
> Como el verbo «abrir»: abrir una puerta, abrir una lata y abrir un libro se dicen igual, pero cada uno se hace de forma distinta según lo que tengas en la mano.

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

> [!prueba]
> Cambia `contarPares(1, 10)` por `contarPares(1, 15)` y ejecuta. ¿Te sale el número que esperabas?

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

> [!resumen]
> - Java pasa los argumentos **por valor**: el método recibe copias.
> - Las variables de un método son locales a él.
> - La sobrecarga permite varios métodos con el mismo nombre y distintos parámetros.
> - Construye métodos grandes combinando métodos pequeños.
