Hay un puñado de recorridos que aparecen una y otra vez. Conocerlos de memoria te ahorra mucho tiempo.

> [!analogia]
> Son como los movimientos básicos de la cocina: picar, batir, freír. Casi cualquier receta (problema) se resuelve combinando unos pocos.

## Buscar un elemento

```java
public class Main {
    static int buscar(int[] valores, int buscado) {
        for (int i = 0; i < valores.length; i++) {
            if (valores[i] == buscado) {
                return i;      // posición de la primera aparición
            }
        }
        return -1;             // convención: -1 significa "no está"
    }

    public static void main(String[] args) {
        int[] datos = {4, 8, 15, 16, 23, 42};
        System.out.println(buscar(datos, 16));
        System.out.println(buscar(datos, 7));
    }
}
```

> [!prueba]
> Cambia `buscar(datos, 7)` por `buscar(datos, 4)` y ejecuta. ¿Por qué sale 0 y no 1?

## Máximo, mínimo y conteos

> [!analogia]
> Buscar el máximo es como un concurso de «el rey de la pista»: el primero se sube al podio y cada nuevo participante que sea mejor lo baja y ocupa su lugar.

```java
public class Main {
    public static void main(String[] args) {
        int[] datos = {12, -3, 45, 7, 45, 0};
        int maximo = datos[0];
        int vecesMaximo = 0;
        for (int valor : datos) {
            if (valor > maximo) {
                maximo = valor;
            }
        }
        for (int valor : datos) {
            if (valor == maximo) {
                vecesMaximo++;
            }
        }
        System.out.println("Máximo " + maximo + ", aparece " + vecesMaximo + " veces");
    }
}
```

> [!cuidado]
> Empieza con `datos[0]`, no con 0. Si todos los valores son negativos, por ejemplo `{-5, -2, -9}`, empezar con 0 te daría un máximo de 0, que ni siquiera está en el array.

## Invertir en el sitio

Intercambia el primero con el último, el segundo con el penúltimo… hasta llegar a la mitad:

```java
public class Main {
    public static void main(String[] args) {
        int[] datos = {1, 2, 3, 4, 5};
        for (int i = 0; i < datos.length / 2; i++) {
            int j = datos.length - 1 - i;
            int auxiliar = datos[i];
            datos[i] = datos[j];
            datos[j] = auxiliar;
        }
        System.out.println(java.util.Arrays.toString(datos));
    }
}
```

> [!idea]
> Para intercambiar dos valores necesitas una tercera variable (`auxiliar`), igual que para intercambiar el contenido de dos vasos necesitas un tercer vaso.

## Ordenar: el método de la burbuja

Recorre el array intercambiando parejas vecinas desordenadas; tras cada pasada, el mayor queda al final:

```java
public class Main {
    public static void main(String[] args) {
        int[] datos = {5, 1, 4, 2, 8};
        for (int pasada = 0; pasada < datos.length - 1; pasada++) {
            for (int i = 0; i < datos.length - 1 - pasada; i++) {
                if (datos[i] > datos[i + 1]) {
                    int auxiliar = datos[i];
                    datos[i] = datos[i + 1];
                    datos[i + 1] = auxiliar;
                }
            }
        }
        System.out.println(java.util.Arrays.toString(datos));
    }
}
```

Es lento con muchos datos (hace del orden de n² comparaciones), pero es el mejor para entender cómo se ordena. En la práctica usarás `Arrays.sort`.

## La clase Arrays

`java.util.Arrays` trae las operaciones habituales ya hechas:

```java
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] datos = {42, 7, 19, 3};
        System.out.println(Arrays.toString(datos));   // [42, 7, 19, 3]
        Arrays.sort(datos);
        System.out.println(Arrays.toString(datos));   // [3, 7, 19, 42]
        System.out.println(Arrays.binarySearch(datos, 19)); // 2 (necesita el array ordenado)

        int[] copia = Arrays.copyOf(datos, 6);        // copia y amplía con ceros
        System.out.println(Arrays.toString(copia));
        int[] tramo = Arrays.copyOfRange(datos, 1, 3); // posiciones 1 y 2
        System.out.println(Arrays.toString(tramo));

        int[] llenos = new int[4];
        Arrays.fill(llenos, 9);
        System.out.println(Arrays.equals(llenos, new int[] {9, 9, 9, 9}));
    }
}
```

`Arrays.copyOf` crea un array **nuevo**; el original no se toca:

```memoria
stack main
datos: @1
copia: @2
heap
@1 int[]: [3, 7, 19, 42]
@2 int[]: [3, 7, 19, 42, 0, 0]
```

> [!cuidado]
> `System.out.println(datos)` imprime algo como `[I@1b6d3586` (la dirección del objeto). Para ver el contenido usa `Arrays.toString(datos)`.

> [!resumen]
> - Buscar devuelve la posición o `-1`; máximo y mínimo empiezan por el primer elemento.
> - Invertir: intercambia `i` con `length - 1 - i` hasta la mitad.
> - La burbuja enseña a ordenar; `Arrays.sort` es lo que se usa.
> - `Arrays.toString`, `copyOf`, `fill`, `equals` y `binarySearch` resuelven lo cotidiano.
