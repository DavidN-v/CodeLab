Ya has usado genéricos: `List<String>`, `Map<String, Integer>`. Ese `<String>` es un **parámetro de tipo**: le dice a la lista qué guarda, y el compilador lo comprueba.

## El problema que resuelven

Antes de los genéricos (Java 5), las colecciones guardaban `Object` y había que convertir al sacar:

```java fragment
List lista = new ArrayList();      // sin tipo
lista.add("hola");
lista.add(42);                     // nadie lo impide
String texto = (String) lista.get(1);   // ClassCastException en ejecución
```

Con genéricos el error aparece **al compilar**, que es donde quieres encontrarlo:

```java fragment
List<String> lista = new ArrayList<>();
lista.add(42);                     // no compila
String texto = lista.get(0);       // sin conversión
```

## Tu propia clase genérica

Declara uno o más parámetros de tipo entre `< >` tras el nombre de la clase, y úsalos como si fueran tipos:

```java
class Caja<T> {
    private T contenido;

    void guardar(T valor) {
        contenido = valor;
    }

    T sacar() {
        return contenido;
    }

    boolean estaVacia() {
        return contenido == null;
    }
}

public class Main {
    public static void main(String[] args) {
        Caja<String> cajaDeTexto = new Caja<>();
        cajaDeTexto.guardar("un regalo");
        String regalo = cajaDeTexto.sacar();      // sin casting
        System.out.println(regalo);

        Caja<Integer> cajaDeNumeros = new Caja<>();
        cajaDeNumeros.guardar(7);
        System.out.println(cajaDeNumeros.sacar() * 6);
        // cajaDeNumeros.guardar("siete");   ← no compila
    }
}
```

`T` es un nombre convencional: **T**ype. Otros habituales son `E` (elemento), `K` y `V` (clave y valor), `R` (resultado).

El `<>` vacío al crear (`new Caja<>()`) es el **operador diamante**: el compilador deduce el tipo de la declaración.

## Varios parámetros

```java
class Par<A, B> {
    private final A primero;
    private final B segundo;

    Par(A primero, B segundo) {
        this.primero = primero;
        this.segundo = segundo;
    }

    A getPrimero() {
        return primero;
    }

    B getSegundo() {
        return segundo;
    }

    Par<B, A> invertir() {
        return new Par<>(segundo, primero);
    }
}

public class Main {
    public static void main(String[] args) {
        Par<String, Integer> edad = new Par<>("Ada", 36);
        System.out.println(edad.getPrimero() + " " + edad.getSegundo());
        Par<Integer, String> alReves = edad.invertir();
        System.out.println(alReves.getPrimero() + " " + alReves.getSegundo());
    }
}
```

Un `record` también puede ser genérico: `record Par<A, B>(A primero, B segundo) {}`.

## Solo tipos objeto

Los parámetros de tipo no admiten primitivos: `Caja<int>` no compila. Se usan los envoltorios (`Caja<Integer>`), y el autoboxing hace el resto.

## Resumen

- Los genéricos mueven los errores de tipo de la ejecución a la compilación.
- `class Nombre<T> { ... }` declara un parámetro de tipo que se usa dentro como un tipo más.
- `new Clase<>()` deduce el tipo (diamante).
- No admiten primitivos: usa `Integer`, `Double`…
