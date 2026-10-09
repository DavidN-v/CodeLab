Un array puede contener otros arrays. Así se forman **matrices**: tablas de filas y columnas, como un tablero, una hoja de cálculo o una imagen.

> [!analogia]
> Una matriz es como el patio de butacas de un cine: para encontrar tu asiento necesitas dos números, la fila y el número de butaca. `cine[3][7]` es la fila 3, butaca 7.

## Crear una matriz

```java
public class Main {
    public static void main(String[] args) {
        int[][] tablero = new int[3][4];   // 3 filas, 4 columnas
        tablero[0][2] = 5;                 // fila 0, columna 2

        int[][] tabla = {
            {1, 2, 3},
            {4, 5, 6}
        };
        System.out.println(tabla[1][0]);         // 4
        System.out.println(tabla.length);        // 2 filas
        System.out.println(tabla[0].length);     // 3 columnas
    }
}
```

`matriz[fila][columna]`. `matriz.length` es el número de filas y `matriz[f].length` el de columnas de la fila `f`.

En memoria, `tabla` apunta a un array de filas, y cada fila es a su vez un array de `int`:

```memoria
stack main
tabla: @1
heap
@1 int[][]: [@2, @3]
@2 int[]: [1, 2, 3]
@3 int[]: [4, 5, 6]
```

> [!prueba]
> Cambia `tabla[1][0]` por `tabla[0][1]` y ejecuta. ¿Sale el número que esperabas? Primero va la fila y después la columna.

## Recorrer: dos bucles anidados

```java
public class Main {
    public static void main(String[] args) {
        int[][] tabla = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        int suma = 0;
        for (int f = 0; f < tabla.length; f++) {
            for (int c = 0; c < tabla[f].length; c++) {
                System.out.print(tabla[f][c] + " ");
                suma += tabla[f][c];
            }
            System.out.println();
        }
        System.out.println("Suma: " + suma);
    }
}
```

> [!idea]
> El bucle de fuera elige la fila; el de dentro recorre las columnas de esa fila. Por cada vuelta del de fuera, el de dentro da todas sus vueltas.

## Operaciones típicas

Sumar por filas, sumar por columnas y la diagonal:

```java
public class Main {
    public static void main(String[] args) {
        int[][] m = {
            {2, 0, 1},
            {3, 5, 4},
            {6, 1, 7}
        };
        for (int f = 0; f < m.length; f++) {
            int sumaFila = 0;
            for (int c = 0; c < m[f].length; c++) {
                sumaFila += m[f][c];
            }
            System.out.println("Fila " + f + ": " + sumaFila);
        }
        for (int c = 0; c < m[0].length; c++) {
            int sumaColumna = 0;
            for (int f = 0; f < m.length; f++) {
                sumaColumna += m[f][c];
            }
            System.out.println("Columna " + c + ": " + sumaColumna);
        }
        int diagonal = 0;
        for (int i = 0; i < m.length; i++) {
            diagonal += m[i][i];
        }
        System.out.println("Diagonal: " + diagonal);
    }
}
```

Para sumar columnas, el bucle **exterior** recorre las columnas y el interior las filas.

> [!cuidado]
> Es muy fácil confundir `m[f][c]` con `m[c][f]`. En una matriz cuadrada no da error, pero suma lo que no es; en una rectangular, acabas fuera de rango.

## Matrices irregulares

Como cada fila es un array independiente, pueden tener tamaños distintos:

```java
public class Main {
    public static void main(String[] args) {
        int[][] triangulo = new int[4][];
        for (int f = 0; f < triangulo.length; f++) {
            triangulo[f] = new int[f + 1];
            for (int c = 0; c <= f; c++) {
                triangulo[f][c] = c + 1;
            }
        }
        System.out.println(java.util.Arrays.deepToString(triangulo));
    }
}
```

`Arrays.deepToString` muestra arrays de varias dimensiones.

> [!resumen]
> - `tipo[][] m = new tipo[filas][columnas];` y `m[f][c]` para acceder.
> - `m.length` son las filas; `m[f].length`, las columnas de esa fila.
> - Dos bucles anidados recorren la matriz; intercámbialos para trabajar por columnas.
> - `Arrays.deepToString` imprime matrices.
