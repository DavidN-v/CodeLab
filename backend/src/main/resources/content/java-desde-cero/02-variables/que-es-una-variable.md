Una **variable** es un nombre que guarda un valor para usarlo después. Piensa en ella como una caja con etiqueta: la etiqueta es el nombre, y dentro está el valor, que puede cambiar.

## Declarar una variable

En Java cada variable tiene un **tipo** que dice qué puede guardar. Se declara escribiendo el tipo y el nombre:

```java fragment
int edad;          // un número entero
String nombre;     // un texto
double precio;     // un número con decimales
```

Declarar solo reserva la caja; todavía está vacía.

## Inicializar y asignar

El operador `=` **asigna**: guarda el valor de la derecha en la variable de la izquierda. Lo normal es declarar e inicializar a la vez:

```java
public class Main {
    public static void main(String[] args) {
        int edad = 36;
        String nombre = "Ada";
        double altura = 1.65;

        System.out.println(nombre + " tiene " + edad + " años y mide " + altura + " m");
    }
}
```

> **Importante:** `=` no significa "es igual" como en matemáticas, sino "guarda". `x = x + 1` es perfectamente válido: calcula `x + 1` y guarda el resultado en `x`.

## Reasignar

Una variable puede cambiar de valor tantas veces como quieras, pero **nunca de tipo**:

```java
public class Main {
    public static void main(String[] args) {
        int puntos = 10;
        System.out.println(puntos);

        puntos = 25;
        System.out.println(puntos);

        puntos = puntos + 5;
        System.out.println(puntos);
    }
}
```

Imprime `10`, `25` y `30`. Fíjate en que al reasignar no se repite el tipo: `int puntos = 25;` sería declarar otra vez, y el compilador se quejaría de que `puntos` ya existe.

## Usar una variable antes de darle valor

Java no deja leer una variable local que no tiene valor:

```java error
public class Main {
    public static void main(String[] args) {
        int total;
        System.out.println(total);   // error: variable total might not have been initialized
    }
}
```

Es una protección: en otros lenguajes leerías basura de la memoria; Java te obliga a decidir qué vale antes.

## Varias variables a la vez

Puedes declarar varias del mismo tipo en una línea, aunque suele leerse mejor una por línea:

```java fragment
int ancho = 3, alto = 4;
```

## Copias, no enlaces

Al asignar una variable a otra se **copia el valor**. Después son independientes:

```java
public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = a;   // b recibe una copia del 5
        a = 100;
        System.out.println("a = " + a + ", b = " + b);
    }
}
```

Imprime `a = 100, b = 5`. (Con los objetos la historia tiene matices; los verás en el módulo de Objetos.)

## Resumen

- Una variable tiene **tipo**, **nombre** y **valor**.
- `tipo nombre = valor;` declara e inicializa.
- `=` asigna; puedes reasignar el valor pero no cambiar el tipo.
- Java no te deja leer una variable sin valor.
