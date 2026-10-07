## Una sorpresa con la herencia

`Integer` es un subtipo de `Number`, pero `List<Integer>` **no** es un subtipo de `List<Number>`:

```java fragment
List<Integer> enteros = new ArrayList<>();
List<Number> numeros = enteros;   // no compila
numeros.add(3.14);                // si compilara, meteríamos un Double en una lista de Integer
```

Por eso existen los **comodines** (`?`), que expresan "una lista de algún tipo relacionado con este".

## ? extends T: leer

`List<? extends Number>` significa "una lista de `Number` o de algún subtipo". Puedes **leer** sus elementos como `Number`, pero no añadir (no sabes de qué subtipo concreto es la lista):

```java
import java.util.List;

public class Main {
    static double total(List<? extends Number> numeros) {
        double suma = 0;
        for (Number n : numeros) {
            suma += n.doubleValue();
        }
        return suma;
    }

    public static void main(String[] args) {
        List<Integer> enteros = List.of(1, 2, 3);
        List<Double> decimales = List.of(0.5, 0.25);
        System.out.println(total(enteros));
        System.out.println(total(decimales));
    }
}
```

## ? super T: escribir

`List<? super Integer>` significa "una lista de `Integer` o de algún supertipo" (`Number`, `Object`). Puedes **añadir** `Integer` con seguridad, pero al leer solo sabes que obtienes un `Object`:

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    static void rellenar(List<? super Integer> destino, int cuantos) {
        for (int i = 1; i <= cuantos; i++) {
            destino.add(i);
        }
    }

    public static void main(String[] args) {
        List<Number> numeros = new ArrayList<>();
        List<Object> objetos = new ArrayList<>();
        rellenar(numeros, 3);
        rellenar(objetos, 2);
        System.out.println(numeros + " " + objetos);
    }
}
```

## PECS

La regla para recordar cuál usar: **P**roducer **E**xtends, **C**onsumer **S**uper.

- Si la colección **produce** elementos que tú lees → `? extends T`.
- Si la colección **consume** elementos que tú escribes → `? super T`.
- Si haces las dos cosas → el tipo exacto, sin comodín.

`Collections.copy(List<? super T> destino, List<? extends T> origen)` es el ejemplo canónico: lee del origen y escribe en el destino.

## ? a secas

`List<?>` es "una lista de algo": útil cuando solo usas métodos que no dependen del tipo, como `size()` o imprimirla.

## En la práctica

Usarás comodines sobre todo al **leer firmas** de la biblioteca estándar (`Comparator<? super T>`, `Collection<? extends E>`). En tu propio código, empieza con tipos exactos y añade comodines cuando una llamada razonable no compile.

## Resumen

- `List<Integer>` no es un `List<Number>`; los comodines resuelven ese hueco.
- `? extends T` para leer (productor), `? super T` para escribir (consumidor): PECS.
- `List<?>` cuando el tipo no importa.
