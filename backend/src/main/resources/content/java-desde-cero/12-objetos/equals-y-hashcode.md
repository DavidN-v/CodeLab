## == compara referencias

Con objetos, `==` pregunta si dos referencias apuntan **al mismo objeto**, no si son iguales en contenido:

> [!analogia]
> Dos galletas hechas con el mismo molde son iguales en forma, pero son **dos** galletas. `==` pregunta «¿es la misma galleta?»; `equals` debería preguntar «¿son iguales?».

```java
class Punto {
    final int x;
    final int y;

    Punto(int x, int y) {
        this.x = x;
        this.y = y;
    }
}

public class Main {
    public static void main(String[] args) {
        Punto a = new Punto(1, 2);
        Punto b = new Punto(1, 2);
        Punto c = a;
        System.out.println(a == b);       // false: dos objetos distintos
        System.out.println(a == c);       // true: el mismo objeto
        System.out.println(a.equals(b));  // false... de momento
    }
}
```

```memoria
stack main
a: @1
b: @2
c: @1
heap
@1 Punto: x=1, y=2
@2 Punto: x=1, y=2
```

`a` y `c` señalan el mismo objeto (`@1`); `b` señala otro con el mismo contenido.

Todo objeto hereda un método `equals` de la clase `Object`, pero por defecto hace lo mismo que `==`. Para que dos puntos con las mismas coordenadas sean iguales, hay que **sobrescribirlo**.

## Sobrescribir equals

```java
import java.util.Objects;

class Punto {
    private final int x;
    private final int y;

    Punto(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object otro) {
        if (this == otro) {
            return true;
        }
        if (!(otro instanceof Punto p)) {
            return false;
        }
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
}

public class Main {
    public static void main(String[] args) {
        Punto a = new Punto(1, 2);
        Punto b = new Punto(1, 2);
        System.out.println(a.equals(b));                     // true
        System.out.println(a.hashCode() == b.hashCode());    // true
        System.out.println(a.equals(new Punto(2, 1)));      // false
    }
}
```

> [!prueba]
> Añade `System.out.println(a.equals(new Punto(1, 3)));` al `main` y ejecuta. Luego borra el método `equals` entero: ¿qué imprime ahora `a.equals(b)`?

Pasos de un buen `equals`:

1. Si es el mismo objeto, `true`.
2. Si el otro no es del mismo tipo (o es `null`), `false`. `otro instanceof Punto p` comprueba el tipo y, si encaja, lo deja disponible como `p`.
3. Compara los campos que definen la igualdad.

`@Override` le dice al compilador "esto sobrescribe un método heredado": si te equivocas en la firma (por ejemplo, `equals(Punto otro)`), te avisa.

## hashCode va siempre con equals

`hashCode` devuelve un número que resume el objeto. Las colecciones como `HashSet` y `HashMap` (módulo de Collections) lo usan para encontrar elementos rápido. La regla:

> [!idea]
> Si dos objetos son iguales según `equals`, **deben** tener el mismo `hashCode`.

> [!analogia]
> `hashCode` es como el número de pasillo de un supermercado. Para buscar la leche, vas directo al pasillo 7 en lugar de recorrer la tienda entera. Si dos cartones de leche iguales estuvieran en pasillos distintos, nunca encontrarías el segundo.

Si sobrescribes `equals` y no `hashCode`, un `HashSet` puede contener dos puntos "iguales" o no encontrar uno que sí está. `Objects.hash(campo1, campo2, ...)` genera un `hashCode` correcto con los mismos campos que usas en `equals`.

> [!cuidado]
> Con textos pasa lo mismo: compara `String` con `equals`, nunca con `==`. Dos textos iguales leídos del teclado son objetos distintos, y `==` dirá `false`.

## Qué campos usar

Usa los campos que definen la **identidad lógica** del objeto: dos `Punto` con las mismas coordenadas son el mismo punto. Dos `Usuario` probablemente sean el mismo si tienen el mismo identificador, aunque cambie su nombre. Y es más seguro hacerlo con campos que no cambian (`final`).

> [!resumen]
> - Con objetos, `==` compara referencias; `equals` debería comparar contenido.
> - Sobrescribe `equals` comprobando identidad, tipo y campos, con `@Override`.
> - Siempre que sobrescribas `equals`, sobrescribe `hashCode` con los mismos campos.
