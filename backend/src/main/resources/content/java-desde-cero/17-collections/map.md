Un `Map` asocia **claves** con **valores**: un DNI con una persona, una palabra con su definición, un producto con su stock. Las claves son únicas; los valores pueden repetirse.

> [!analogia]
> Un `Map` es como un diccionario de papel: buscas la palabra (la **clave**) y lees su definición (el **valor**). No hay dos entradas con la misma palabra, pero dos palabras sí pueden tener la misma definición.

## HashMap

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> stock = new HashMap<>();
        stock.put("manzanas", 40);
        stock.put("peras", 15);
        stock.put("manzanas", 35);                     // misma clave: reemplaza
        System.out.println(stock.get("peras"));         // 15
        System.out.println(stock.get("kiwis"));         // null: no existe
        System.out.println(stock.getOrDefault("kiwis", 0));
        System.out.println(stock.containsKey("peras"));
        stock.remove("peras");
        System.out.println(stock.size() + " " + stock);
    }
}
```

`Map<String, Integer>`: el primer tipo es el de las claves y el segundo el de los valores. Buscar por clave (`get`, `containsKey`) es casi instantáneo, como en un `HashSet`.

> [!prueba]
> Cambia `stock.put("manzanas", 35)` por `stock.put("Manzanas", 35)` y vuelve a ejecutar: ¿qué pasa? Ahora son dos claves distintas, así que el mapa acaba con un elemento más.

> [!cuidado]
> `get` de una clave que no existe devuelve `null`. Si haces `int n = stock.get("kiwis");` el programa lanza `NullPointerException`. Usa `getOrDefault` o comprueba antes con `containsKey`.

## Recorrer un Map

```java
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        Map<String, Double> precios = new TreeMap<>(Map.of("café", 1.5, "té", 1.2, "zumo", 2.8));
        for (Map.Entry<String, Double> entrada : precios.entrySet()) {
            System.out.println(entrada.getKey() + " -> " + entrada.getValue());
        }
        for (String producto : precios.keySet()) {
            System.out.print(producto + " ");
        }
        System.out.println();
        precios.forEach((producto, precio) -> System.out.println(producto + ": " + precio));
    }
}
```

Como con los conjuntos, hay tres sabores: `HashMap` (sin orden), `LinkedHashMap` (orden de inserción) y `TreeMap` (ordenado por clave).

## Contar con un Map

El uso estrella de los mapas es contar o agrupar:

```java
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        String texto = "el perro y el gato y el loro";
        Map<String, Integer> cuenta = new TreeMap<>();
        for (String palabra : texto.split(" ")) {
            cuenta.merge(palabra, 1, Integer::sum);
        }
        System.out.println(cuenta);   // {el=3, gato=1, loro=1, perro=1, y=2}
    }
}
```

`merge(clave, 1, Integer::sum)` significa: si la clave no está, ponle 1; si está, súmale 1. Es equivalente a `cuenta.put(palabra, cuenta.getOrDefault(palabra, 0) + 1)`.

> [!idea]
> Para contar cosas, piensa en un `Map` de «cosa» a «cuántas veces».

## Agrupar en listas

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        String[] nombres = {"Ana", "Alberto", "Bea", "Carlos", "Belén"};
        Map<Character, List<String>> porInicial = new TreeMap<>();
        for (String nombre : nombres) {
            porInicial.computeIfAbsent(nombre.charAt(0), letra -> new ArrayList<>()).add(nombre);
        }
        System.out.println(porInicial);   // {A=[Ana, Alberto], B=[Bea, Belén], C=[Carlos]}
    }
}
```

`computeIfAbsent` crea la lista la primera vez que aparece una clave y la devuelve las siguientes.

## ¿Qué colección elijo?

| Necesito… | Usa |
| --- | --- |
| Elementos en orden, con repetidos, por posición | `List` (`ArrayList`) |
| Elementos únicos, comprobar si están | `Set` (`HashSet`) |
| Buscar un valor a partir de una clave | `Map` (`HashMap`) |
| Lo mismo pero ordenado | `TreeSet` / `TreeMap` |

> [!resumen]
> - `Map<K, V>`: `put`, `get`, `getOrDefault`, `containsKey`, `remove`.
> - Recorre con `entrySet()`, `keySet()` o `forEach((k, v) -> ...)`.
> - `merge` para contar y `computeIfAbsent` para agrupar.
> - `HashMap` sin orden, `LinkedHashMap` por inserción, `TreeMap` ordenado por clave.
