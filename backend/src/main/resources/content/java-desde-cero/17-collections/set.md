Un `Set` es una colección **sin repetidos**: añadir un elemento que ya está no tiene efecto. Es la herramienta para eliminar duplicados y para preguntar "¿está esto?" muy rápido.

> [!analogia]
> Un `Set` es como la lista de invitados de una fiesta en la puerta: cada nombre aparece una sola vez. Si alguien intenta entrar otra vez, el portero mira la lista, ve que ya está y no lo apunta de nuevo.

## HashSet

```java
import java.util.HashSet;
import java.util.Set;

public class Main {
    public static void main(String[] args) {
        Set<String> etiquetas = new HashSet<>();
        System.out.println(etiquetas.add("java"));     // true: se añadió
        System.out.println(etiquetas.add("spring"));   // true
        System.out.println(etiquetas.add("java"));     // false: ya estaba
        System.out.println(etiquetas.size());          // 2
        System.out.println(etiquetas.contains("spring"));
        etiquetas.remove("spring");
        System.out.println(etiquetas);
    }
}
```

`contains` en un `HashSet` es casi instantáneo aunque tenga millones de elementos, mientras que en una `List` hay que recorrerla entera. Si vas a preguntar mucho "¿está?", usa un `Set`.

> [!prueba]
> Añade la línea `System.out.println(etiquetas.add("Java"));` antes del `remove` y ejecuta: imprime `true`, porque `"Java"` con mayúscula es un texto distinto de `"java"`.

Para que funcione con tus propias clases, deben implementar `equals` y `hashCode` correctamente (módulo de Objetos); los `record` ya lo hacen.

## Las tres implementaciones

| Implementación | Orden al recorrer | Uso típico |
| --- | --- | --- |
| `HashSet` | Ninguno garantizado | La más rápida; cuando el orden no importa |
| `LinkedHashSet` | El de inserción | Quitar duplicados conservando el orden original |
| `TreeSet` | Ordenado (natural o con `Comparator`) | Mantener los elementos siempre ordenados |

```java
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        List<String> visitas = List.of("inicio", "cursos", "inicio", "panel", "cursos");
        Set<String> enOrden = new LinkedHashSet<>(visitas);
        Set<String> ordenadas = new TreeSet<>(visitas);
        System.out.println(enOrden);     // [inicio, cursos, panel]
        System.out.println(ordenadas);   // [cursos, inicio, panel]
    }
}
```

> [!cuidado]
> No dependas del orden de un `HashSet` al imprimirlo; puede cambiar entre versiones de Java o ejecuciones. Si el orden importa, usa `LinkedHashSet` o `TreeSet`.

## Operaciones de conjuntos

```java
import java.util.Set;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        Set<Integer> a = new TreeSet<>(Set.of(1, 2, 3, 4));
        Set<Integer> b = Set.of(3, 4, 5);

        Set<Integer> union = new TreeSet<>(a);
        union.addAll(b);
        Set<Integer> interseccion = new TreeSet<>(a);
        interseccion.retainAll(b);
        Set<Integer> diferencia = new TreeSet<>(a);
        diferencia.removeAll(b);

        System.out.println(union + " " + interseccion + " " + diferencia);
    }
}
```

Fíjate en que se copia `a` antes de cada operación, porque `addAll`, `retainAll` y `removeAll` modifican el conjunto sobre el que se llaman.

## TreeSet y sus extras

`TreeSet` ofrece consultas sobre el orden: `first()`, `last()`, `floor(x)` (el mayor ≤ x), `ceiling(x)` (el menor ≥ x), `headSet(x)` (los menores que x).

> [!resumen]
> - `Set` no admite repetidos; `add` devuelve `false` si el elemento ya estaba.
> - `contains` es muy rápido: úsalo para comprobar pertenencia.
> - `HashSet` sin orden, `LinkedHashSet` con orden de inserción, `TreeSet` ordenado.
> - `addAll`, `retainAll` y `removeAll` hacen unión, intersección y diferencia.
