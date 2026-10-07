Imagina que haces una cuenta en un papel y quieres recordar un resultado para usarlo después. En un programa pasa lo mismo: necesitas guardar datos (una edad, un nombre, un precio) para usarlos más adelante. Para eso están las variables.

Una **variable** es un nombre que guarda un valor para usarlo después.

> [!analogia]
> Una variable es una caja con una etiqueta. La etiqueta es el nombre (`edad`), lo de dentro es el valor (`36`) y la forma de la caja es el tipo: en una caja para números enteros no cabe un texto.

## Declarar una variable

En Java cada variable tiene un **tipo** que dice qué puede guardar. Se declara escribiendo el tipo y el nombre:

```java fragment
int edad;          // un número entero
String nombre;     // un texto
double precio;     // un número con decimales
```

Declarar solo reserva la caja; todavía está vacía.

## Inicializar y asignar

El operador `=` **asigna**: guarda el valor de la derecha en la variable de la izquierda. Lo normal es declarar e inicializar (dar el primer valor) a la vez:

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

Así queda la memoria tras esas tres líneas. Los números se guardan dentro de la caja; el texto vive aparte y la caja `nombre` apunta a él:

```memoria
stack main
edad: 36
nombre: @1
altura: 1.65
heap
@1 String: "Ada"
```

> [!prueba]
> Cambia `36` por tu edad y `"Ada"` por tu nombre, y vuelve a ejecutar. El mensaje se adapta solo, sin tocar el `println`.

> [!idea]
> `=` no significa "es igual" como en matemáticas, sino **"guarda"**. `x = x + 1` es perfectamente válido: calcula `x + 1` y guarda el resultado en `x`.

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

Imprime `10`, `25` y `30`. Cada nuevo valor sustituye al anterior, que se pierde.

> [!cuidado]
> Al reasignar no se repite el tipo. `int puntos = 25;` sería declarar otra vez, y el compilador se quejaría de que `puntos` ya existe (`variable puntos is already defined`). Escribe solo `puntos = 25;`.

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

```memoria
stack main
a: 100
b: 5
```

Imprime `a = 100, b = 5`. (Con los objetos la historia tiene matices; los verás en el módulo de Objetos.)

> [!analogia]
> Es como fotocopiar una nota: si después escribes en el original, la fotocopia no cambia.

> [!resumen]
> - Una variable tiene **tipo**, **nombre** y **valor**: `tipo nombre = valor;`.
> - `=` significa "guarda"; puedes cambiar el valor, pero nunca el tipo.
> - Java no te deja leer una variable sin valor.
> - Copiar una variable en otra copia el valor; luego son independientes.
