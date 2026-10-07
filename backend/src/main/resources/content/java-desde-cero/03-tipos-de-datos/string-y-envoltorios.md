`String` no es un primitivo: es una **clase**, y cada texto es un objeto. Aun así se usa tanto que Java le da trato especial, como escribirlo con comillas dobles.

## String frente a char

```java
public class Main {
    public static void main(String[] args) {
        char inicial = 'A';            // un solo carácter, comillas simples
        String nombre = "Ada";         // una secuencia de caracteres, comillas dobles
        String vacio = "";             // un texto sin caracteres
        System.out.println(inicial + " " + nombre + " [" + vacio + "] " + nombre.length());
    }
}
```

Algunas operaciones básicas (el módulo de Strings las cubre todas):

| Método | Resultado con `"Java"` |
| --- | --- |
| `length()` | `4` |
| `charAt(0)` | `'J'` |
| `toUpperCase()` | `"JAVA"` |
| `contains("av")` | `true` |

## Comparar textos: equals, no ==

```java
public class Main {
    public static void main(String[] args) {
        String a = "hola";
        String b = new String("hola");
        System.out.println(a == b);        // false: ¿son el mismo objeto?
        System.out.println(a.equals(b));   // true: ¿tienen el mismo contenido?
    }
}
```

`==` compara si dos variables apuntan al **mismo objeto**; `equals` compara el **contenido**. Para textos usa siempre `equals` (o `equalsIgnoreCase` si no importan las mayúsculas).

## Las clases envoltorio

Cada primitivo tiene una clase que lo "envuelve" en un objeto:

| Primitivo | Envoltorio |
| --- | --- |
| `int` | `Integer` |
| `double` | `Double` |
| `boolean` | `Boolean` |
| `char` | `Character` |
| `long` | `Long` |

Sirven para dos cosas principales: guardar números en colecciones (que solo admiten objetos) y ofrecer utilidades. Java convierte entre primitivo y envoltorio automáticamente (*autoboxing*):

```java
public class Main {
    public static void main(String[] args) {
        Integer envuelto = 42;      // autoboxing
        int suelto = envuelto;      // unboxing
        System.out.println(envuelto + suelto);
        System.out.println(Integer.MAX_VALUE + " " + Double.MIN_VALUE);
        System.out.println(Character.isDigit('7') + " " + Character.toUpperCase('q'));
    }
}
```

## De texto a número y de número a texto

Este es el uso más frecuente de los envoltorios:

```java
public class Main {
    public static void main(String[] args) {
        int edad = Integer.parseInt("36");
        double precio = Double.parseDouble("19.95");
        String texto = String.valueOf(edad);
        String otro = "" + precio;
        System.out.println(edad + 1);       // 37: ya es un número
        System.out.println(texto + 1);      // "361": es un texto
        System.out.println(otro);
    }
}
```

Si el texto no es un número válido, `parseInt` lanza una `NumberFormatException`. Aprenderás a manejarla en el módulo de Excepciones.

## null

Una variable de tipo objeto (como `String` o `Integer`) puede valer `null`: "no apunta a ningún objeto". Llamar a un método sobre `null` produce una `NullPointerException`. Los primitivos nunca son `null`.

## Resumen

- `String` es una clase; `char` es un primitivo de un carácter.
- Compara textos con `equals`, nunca con `==`.
- Cada primitivo tiene un envoltorio (`Integer`, `Double`…) y Java convierte solo entre ambos.
- `Integer.parseInt` y `Double.parseDouble` convierten texto en número; `String.valueOf`, al revés.
