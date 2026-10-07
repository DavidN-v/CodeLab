Algunos datos solo pueden tomar unos pocos valores fijos: los días de la semana, los palos de la baraja, el estado de un pedido. Representarlos con números (`1` = pendiente, `2` = enviado…) o textos es frágil: nada impide un estado `7` o `"enviadoo"`. Un **enum** define un tipo con un conjunto cerrado de valores.

> [!analogia]
> Un enum es como el menú de un restaurante: solo puedes pedir lo que está en la carta. Pedir «sopa de piedras» no es una opción, y el camarero (el compilador) te lo dice al momento.

## Declarar y usar un enum

```java
enum Estado {
    PENDIENTE, PAGADO, ENVIADO, ENTREGADO, CANCELADO
}

public class Main {
    public static void main(String[] args) {
        Estado estado = Estado.PAGADO;
        System.out.println(estado);                    // PAGADO
        System.out.println(estado == Estado.PAGADO);   // true: se comparan con ==
        System.out.println(estado.ordinal());          // 1: posición en la declaración
        System.out.println(Estado.valueOf("ENVIADO")); // de texto a enum
        for (Estado e : Estado.values()) {             // todos los valores, en orden
            System.out.print(e + " ");
        }
        System.out.println();
    }
}
```

- Los valores se escriben en `MAYÚSCULAS` por convención.
- Cada valor es un objeto único, así que se comparan con `==`.
- `values()` devuelve todos; `valueOf("TEXTO")` convierte un texto (lanza `IllegalArgumentException` si no existe).
- El compilador impide cualquier valor que no esté en la lista.

> [!prueba]
> Cambia `Estado.valueOf("ENVIADO")` por `Estado.valueOf("enviado")` (en minúsculas) y ejecuta: ¿qué ocurre?

> [!cuidado]
> `valueOf` distingue mayúsculas y minúsculas: `"pagado"` no es `PAGADO`. Si el texto viene del usuario, conviértelo antes con `toUpperCase()`.

## switch con enums

Los enums encajan perfectamente con `switch`. Y si el `switch` es una expresión que cubre **todos** los valores, no hace falta `default`: el compilador comprueba que no falta ninguno.

```java
enum Dia { LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO }

public class Main {
    static boolean esLaborable(Dia dia) {
        return switch (dia) {
            case SABADO, DOMINGO -> false;
            case LUNES, MARTES, MIERCOLES, JUEVES, VIERNES -> true;
        };
    }

    public static void main(String[] args) {
        System.out.println(esLaborable(Dia.MARTES) + " " + esLaborable(Dia.DOMINGO));
    }
}
```

## Enums con datos y métodos

Un enum es una clase: puede tener campos, un constructor (siempre privado) y métodos.

> [!analogia]
> Ahora cada plato de la carta viene con su ficha: precio y calorías. El plato sigue siendo uno de la lista cerrada, pero además sabe cosas sobre sí mismo.

```java
enum Planeta {
    MERCURIO(3.30e23, 2.44e6),
    TIERRA(5.97e24, 6.37e6),
    JUPITER(1.90e27, 7.15e7);

    private static final double G = 6.67e-11;
    private final double masa;
    private final double radio;

    Planeta(double masa, double radio) {
        this.masa = masa;
        this.radio = radio;
    }

    double gravedad() {
        return G * masa / (radio * radio);
    }

    double pesoDe(double masaKg) {
        return masaKg * gravedad();
    }
}

public class Main {
    public static void main(String[] args) {
        for (Planeta p : Planeta.values()) {
            System.out.printf("%s: 70 kg pesan %.1f N%n", p, p.pesoDe(70));
        }
    }
}
```

## Comportamiento distinto por valor

Cada constante puede tener su propia versión de un método, lo que convierte al enum en una pequeña jerarquía cerrada:

```java
enum Operacion {
    SUMA("+") {
        int aplicar(int a, int b) { return a + b; }
    },
    RESTA("-") {
        int aplicar(int a, int b) { return a - b; }
    },
    PRODUCTO("*") {
        int aplicar(int a, int b) { return a * b; }
    };

    private final String simbolo;

    Operacion(String simbolo) {
        this.simbolo = simbolo;
    }

    abstract int aplicar(int a, int b);

    String simbolo() {
        return simbolo;
    }
}

public class Main {
    public static void main(String[] args) {
        for (Operacion op : Operacion.values()) {
            System.out.println("6 " + op.simbolo() + " 3 = " + op.aplicar(6, 3));
        }
    }
}
```

## Colecciones para enums

`EnumMap` y `EnumSet` son versiones muy eficientes de `Map` y `Set` cuando las claves son de un enum: `new EnumMap<>(Estado.class)`, `EnumSet.of(Dia.SABADO, Dia.DOMINGO)`.

> [!resumen]
> - `enum` define un tipo con un conjunto cerrado de valores; se comparan con `==`.
> - `values()`, `valueOf()` y `ordinal()` vienen incluidos.
> - Un `switch` que cubre todos los valores no necesita `default`.
> - Los enums pueden tener campos, constructor y métodos, incluso uno distinto por valor.
