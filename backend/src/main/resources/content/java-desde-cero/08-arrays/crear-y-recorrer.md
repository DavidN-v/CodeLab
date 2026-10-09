Imagina guardar las notas de 30 alumnos en 30 variables: `nota1`, `nota2`… Imposible de manejar. Un **array** guarda muchos valores del mismo tipo bajo un solo nombre, accesibles por su posición.

> [!analogia]
> Un array es una fila de taquillas numeradas. Todas son iguales, tienen un número pintado (0, 1, 2…) y en cada una cabe un valor. Para abrir una, dices el nombre de la fila y el número: `notas[2]`.

## Crear un array

```java
public class Main {
    public static void main(String[] args) {
        int[] notas = new int[5];           // 5 enteros, todos a 0
        String[] dias = {"lun", "mar", "mié"}; // con valores iniciales

        notas[0] = 7;
        notas[1] = 9;
        System.out.println(notas[0] + notas[1]);
        System.out.println(dias[2]);
        System.out.println("Tamaño: " + notas.length);
    }
}
```

- `int[]` se lee "array de int".
- `new int[5]` crea un array de 5 posiciones. Su **tamaño es fijo**: no puede crecer después.
- Las posiciones (índices) van de **0** a **length − 1**.
- Los valores iniciales son el "cero" de cada tipo: `0`, `0.0`, `false`, o `null` para objetos.
- `length` (sin paréntesis) da el tamaño.

La variable `notas` no contiene las cinco taquillas: guarda una **referencia** (una flecha) al array, que vive en otra zona de la memoria llamada montón:

```memoria
stack main
notas: @1
dias: @2
heap
@1 int[]: [7, 9, 0, 0, 0]
@2 String[]: ["lun", "mar", "mié"]
```

> [!prueba]
> Cambia `System.out.println(dias[2]);` por `System.out.println(dias[0]);` y ejecuta. ¿Qué día sale? Recuerda que se empieza a contar en 0.

## Fuera de rango

Acceder a una posición que no existe lanza una excepción:

```java
public class Main {
    public static void main(String[] args) {
        int[] datos = new int[3];
        datos[3] = 10;   // posiciones válidas: 0, 1, 2
    }
}
```

`ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3`. Es probablemente el error más frecuente con arrays.

> [!cuidado]
> Un array de 3 posiciones **no** tiene posición 3. El último índice es siempre `length - 1`. Por eso los bucles usan `i < datos.length` y no `i <= datos.length`.

## Recorrer con for

El índice de un `for` encaja perfectamente con las posiciones:

```java
public class Main {
    public static void main(String[] args) {
        int[] notas = {7, 9, 4, 8, 6};
        int suma = 0;
        for (int i = 0; i < notas.length; i++) {
            System.out.println("Alumno " + (i + 1) + ": " + notas[i]);
            suma += notas[i];
        }
        System.out.println("Media: " + (double) suma / notas.length);
    }
}
```

> [!prueba]
> Añade una nota más al array, por ejemplo `{7, 9, 4, 8, 6, 10}`, y ejecuta. No hace falta tocar el bucle: `notas.length` se adapta solo.

## for-each

Si solo necesitas los valores (no el índice), el **for mejorado** es más limpio:

```java
public class Main {
    public static void main(String[] args) {
        String[] frutas = {"manzana", "pera", "uva"};
        for (String fruta : frutas) {
            System.out.println(fruta.toUpperCase());
        }
    }
}
```

Se lee "para cada `fruta` en `frutas`". No sirve para modificar el array ni cuando necesitas saber la posición.

## Leer un array desde la entrada

Un formato muy común: primero el número de elementos y luego los elementos.

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
        int n = entrada.nextInt();
        int[] numeros = new int[n];
        for (int i = 0; i < n; i++) {
            numeros[i] = entrada.nextInt();
        }
        System.out.println("Leídos " + numeros.length + " números; el último es " + numeros[n - 1]);
    }
}
```

Prueba con la entrada `4 10 20 30 40`.

## Arrays y métodos

Un array es un objeto: al pasarlo a un método se pasa una referencia a **el mismo** array, así que el método puede modificar su contenido:

```java
public class Main {
    static void duplicarTodos(int[] valores) {
        for (int i = 0; i < valores.length; i++) {
            valores[i] *= 2;
        }
    }

    public static void main(String[] args) {
        int[] datos = {1, 2, 3};
        duplicarTodos(datos);
        System.out.println(datos[0] + " " + datos[1] + " " + datos[2]);
    }
}
```

Imprime `2 4 6`. Mientras `duplicarTodos` trabaja, `datos` y `valores` son dos flechas que apuntan al **mismo** array:

```memoria
stack main
datos: @1
stack duplicarTodos
valores: @1
i: 0
heap
@1 int[]: [1, 2, 3]
```

> [!analogia]
> Pasar un array a un método es como darle a alguien una copia de la llave de tu taquilla, no una copia de la taquilla. Si mete algo dentro, tú también lo verás al abrirla.

Del mismo modo, `int[] b = a;` no copia el array: `a` y `b` apuntan al mismo.

> [!resumen]
> - `tipo[] nombre = new tipo[n];` o `{v1, v2, ...}`; tamaño fijo.
> - Índices de `0` a `length - 1`; fuera de ahí, `ArrayIndexOutOfBoundsException`.
> - `for` con índice para posiciones; for-each para recorrer valores.
> - La variable guarda una referencia: los métodos reciben el mismo array y pueden modificarlo.
