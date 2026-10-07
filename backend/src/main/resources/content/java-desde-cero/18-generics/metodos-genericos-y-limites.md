## Métodos genéricos

Un método puede tener sus propios parámetros de tipo, declarados **antes del tipo de retorno**:

```java
import java.util.List;

public class Main {
    static <T> T ultimo(List<T> lista) {
        return lista.get(lista.size() - 1);
    }

    static <T> void imprimirTodos(T[] elementos) {
        for (T elemento : elementos) {
            System.out.print(elemento + " ");
        }
        System.out.println();
    }

    public static void main(String[] args) {
        String nombre = ultimo(List.of("Ada", "Grace", "Linus"));
        Integer numero = ultimo(List.of(4, 8, 15));
        System.out.println(nombre + " " + numero);
        imprimirTodos(new Double[] {1.5, 2.5});
    }
}
```

El compilador deduce `T` a partir de los argumentos: en la primera llamada es `String`; en la segunda, `Integer`.

## Límites: <T extends Algo>

Dentro de un método genérico, de `T` solo sabes que es un objeto: no puedes llamar a `compareTo` ni sumar. Un **límite superior** restringe `T` a tipos que cumplan un contrato, y a cambio te deja usar sus métodos:

```java
import java.util.List;

public class Main {
    static <T extends Comparable<T>> T maximo(List<T> elementos) {
        T mayor = elementos.get(0);
        for (T elemento : elementos) {
            if (elemento.compareTo(mayor) > 0) {
                mayor = elemento;
            }
        }
        return mayor;
    }

    public static void main(String[] args) {
        System.out.println(maximo(List.of(3, 9, 2)));
        System.out.println(maximo(List.of("pera", "uva", "manzana")));
    }
}
```

`T extends Comparable<T>` se lee "cualquier tipo `T` que sepa compararse con otro `T`". `extends` aquí vale tanto para clases como para interfaces.

```java
import java.util.List;

public class Main {
    static <T extends Number> double sumar(List<T> numeros) {
        double total = 0;
        for (T n : numeros) {
            total += n.doubleValue();   // método de Number
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(sumar(List.of(1, 2, 3)));
        System.out.println(sumar(List.of(1.5, 2.25)));
    }
}
```

## Borrado de tipos

Los genéricos existen solo para el compilador. Al generar el bytecode, Java **borra** los parámetros de tipo (`List<String>` y `List<Integer>` son la misma clase en ejecución). Consecuencias prácticas:

- No puedes hacer `new T()` ni `new T[10]`.
- No puedes preguntar `lista instanceof List<String>`.

Son limitaciones raras en el día a día; lo importante es saber por qué existen.

## Resumen

- `static <T> T metodo(...)` declara un método genérico; el tipo se deduce de los argumentos.
- `<T extends Tipo>` limita `T` y permite usar los métodos de `Tipo`.
- `<T extends Comparable<T>>` es el límite clásico para comparar.
- Los tipos genéricos se borran al compilar: no hay `new T()`.
