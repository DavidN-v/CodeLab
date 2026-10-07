Una variable no existe en todo el programa: existe desde donde se declara hasta el final del **bloque** que la contiene. Ese tramo es su **ámbito** (*scope*).

## Bloques y ámbito

Un bloque es lo que hay entre llaves `{ }`. Una variable declarada dentro de un bloque desaparece al cerrarlo:

```java
public class Main {
    public static void main(String[] args) {
        int exterior = 1;
        {
            int interior = 2;
            System.out.println(exterior + interior);  // las dos existen aquí
        }
        System.out.println(exterior);
        // System.out.println(interior);  ← no compilaría: interior ya no existe
    }
}
```

Las variables declaradas dentro de un `if`, un bucle o un método funcionan igual: viven solo dentro de sus llaves. Lo verás constantemente en los módulos de condicionales y bucles.

Dentro de un mismo método no puedes declarar dos variables con el mismo nombre si sus ámbitos se solapan:

```java error
public class Main {
    public static void main(String[] args) {
        int contador = 0;
        {
            int contador = 5;   // error: variable contador is already defined
        }
    }
}
```

> **Regla práctica:** declara cada variable lo más cerca posible de donde la usas y en el bloque más pequeño que la necesite. Menos ámbito, menos sitios donde algo puede cambiarla por error.

## Constantes con final

Si un valor no debe cambiar nunca, márcalo con `final`. El compilador impedirá cualquier reasignación:

```java
public class Main {
    public static void main(String[] args) {
        final double IVA = 0.21;
        double base = 100;
        System.out.println("Total: " + (base + base * IVA));
        // IVA = 0.10;  ← no compilaría: cannot assign a value to final variable IVA
    }
}
```

`final` comunica intención: quien lea el código sabe que ese valor es fijo.

## Constantes de clase

Las constantes que usa todo el programa se declaran fuera de `main`, a nivel de clase, con `static final`:

```java
public class Main {
    static final int EDAD_MINIMA = 18;
    static final String NOMBRE_APP = "Forja";

    public static void main(String[] args) {
        System.out.println(NOMBRE_APP + " requiere " + EDAD_MINIMA + " años.");
    }
}
```

- `static`: pertenece a la clase, no a un objeto concreto (lo entenderás del todo en el módulo de Clases).
- `final`: no cambia.
- Nombre en `MAYÚSCULAS_CON_GUIONES`, por convención.

Usar constantes con nombre en lugar de "números mágicos" sueltos (`if (edad >= 18)`) hace el código más claro y más fácil de cambiar: si mañana la edad mínima es 16, la cambias en un solo sitio.

## Resumen

- Una variable existe desde su declaración hasta la llave que cierra su bloque.
- No puedes repetir un nombre en ámbitos que se solapan.
- `final` impide reasignar; `static final` a nivel de clase define constantes globales.
- Sustituye los números mágicos por constantes con nombre.
