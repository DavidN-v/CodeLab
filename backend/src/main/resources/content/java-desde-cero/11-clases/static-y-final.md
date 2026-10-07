## Miembros de instancia y de clase

Lo que has escrito hasta ahora en las clases pertenece a **cada objeto**: cada `Alumno` tiene su propio `nombre`. Lo marcado con `static` pertenece a la **clase**, y se comparte entre todos los objetos.

> [!analogia]
> En una clase de colegio, cada alumno tiene su propio cuaderno (campo de instancia), pero solo hay una pizarra para todos (campo `static`). Si alguien escribe en la pizarra, todos lo ven.

```java
class Alumno {
    private static int totalCreados = 0;   // uno para toda la clase
    private final String nombre;            // uno por alumno
    private final int numero;

    Alumno(String nombre) {
        totalCreados++;
        this.nombre = nombre;
        this.numero = totalCreados;
    }

    String ficha() {
        return "#" + numero + " " + nombre;
    }

    static int getTotalCreados() {
        return totalCreados;
    }
}

public class Main {
    public static void main(String[] args) {
        Alumno a = new Alumno("Ada");
        Alumno b = new Alumno("Grace");
        System.out.println(a.ficha());
        System.out.println(b.ficha());
        System.out.println("Total: " + Alumno.getTotalCreados());
    }
}
```

Los miembros estáticos se usan a través del **nombre de la clase**: `Alumno.getTotalCreados()`, igual que `Math.sqrt(...)` o `Integer.parseInt(...)`.

> [!prueba]
> Crea un tercer alumno, `new Alumno("Alan")`, antes del último `println` y ejecuta. ¿Qué número le toca y cuántos dice el total?

```memoria
stack main
a: @1
b: @2
heap
@1 Alumno: nombre=@3, numero=1
@2 Alumno: nombre=@4, numero=2
@3 String: "Ada"
@4 String: "Grace"
@5 Alumno (clase): totalCreados=2
```

Cada alumno guarda su `nombre` y su `numero`; `totalCreados` existe **una sola vez**, en la clase.

## Lo que puede y no puede hacer un método static

Un método `static` no pertenece a ningún objeto, así que **no tiene `this`** y no puede acceder directamente a los campos de instancia:

```java fragment
class Ejemplo {
    private int valor;

    static void metodoDeClase() {
        // System.out.println(valor);   ← no compila: ¿el valor de qué objeto?
    }
}
```

> [!cuidado]
> El error `non-static variable cannot be referenced from a static context` significa justo esto: desde un método `static` (como `main`) intentas usar un campo de instancia sin decir de qué objeto.

Por eso `main` es `static` (la JVM lo llama sin crear ningún objeto) y por eso los métodos que escribiste en el módulo de Métodos llevaban `static`.

## Cuándo usar static

- **Constantes:** `static final double IVA = 0.21;` — una sola copia, que no cambia.
- **Utilidades** que no dependen de ningún objeto: `Math.max`, `Integer.parseInt`, un `static boolean esPrimo(int n)`.
- **Métodos de fábrica**, alternativas con nombre al constructor:

```java
class Color {
    private final int rojo, verde, azul;

    private Color(int rojo, int verde, int azul) {
        this.rojo = rojo;
        this.verde = verde;
        this.azul = azul;
    }

    static Color gris(int nivel) {
        return new Color(nivel, nivel, nivel);
    }

    static Color deHex(String hex) {
        int valor = Integer.parseInt(hex.substring(1), 16);
        return new Color(valor >> 16 & 0xFF, valor >> 8 & 0xFF, valor & 0xFF);
    }

    String describir() {
        return "rgb(" + rojo + ", " + verde + ", " + azul + ")";
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Color.gris(128).describir());
        System.out.println(Color.deHex("#e8a23a").describir());
    }
}
```

Evita usar campos `static` mutables para "compartir datos" entre partes del programa: se convierten en estado global difícil de seguir.

## final, en resumen

| Dónde | Significa |
| --- | --- |
| Variable local o parámetro | No se puede reasignar |
| Campo | Se asigna una vez (declaración o constructor) |
| `static final` | Constante de clase |
| Método | No se puede sobrescribir en subclases (módulo de Herencia) |
| Clase | No se puede heredar de ella (como `String`) |

> [!resumen]
> - `static` pertenece a la clase y se comparte; lo demás pertenece a cada objeto.
> - Los métodos `static` no tienen `this` ni acceden a campos de instancia.
> - Úsalo para constantes, utilidades y métodos de fábrica; evita el estado global mutable.
> - `final` significa «no cambia»: en variables, campos, métodos y clases.
