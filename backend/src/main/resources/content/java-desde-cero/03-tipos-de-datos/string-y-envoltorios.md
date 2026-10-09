`String` no es un primitivo: es una **clase**, y cada texto es un **objeto** (un dato más complejo que vive en otra zona de la memoria). Aun así se usa tanto que Java le da trato especial, como poder escribirlo con comillas dobles.

> [!analogia]
> Un `char` es una sola ficha de Scrabble; un `String` es la palabra entera formada con fichas, colocada en un atril. La variable no guarda el atril: guarda una flecha que señala dónde está.

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

En memoria, el `char` está dentro de su caja, mientras que cada `String` vive en el montón (*heap*) y la variable apunta a él:

```memoria
stack main
inicial: 'A'
nombre: @1
vacio: @2
heap
@1 String: "Ada"
@2 String: ""
```

Algunas operaciones básicas (el módulo de Strings las cubre todas):

| Método | Resultado con `"Java"` |
| --- | --- |
| `length()` | `4` |
| `charAt(0)` | `'J'` |
| `toUpperCase()` | `"JAVA"` |
| `contains("av")` | `true` |

> [!prueba]
> En el ejemplo, cambia `"Ada"` por `"Ada Lovelace"` y ejecuta. ¿Cuánto vale ahora `length()`? Fíjate en que el espacio también cuenta como carácter.

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

```memoria
stack main
a: @1
b: @2
heap
@1 String: "hola"
@2 String: "hola"
```

`==` compara si dos variables apuntan al **mismo objeto**; `equals` compara el **contenido**. Aquí hay dos objetos distintos con el mismo texto.

> [!cuidado]
> Para textos usa siempre `equals` (o `equalsIgnoreCase` si no importan las mayúsculas). `==` a veces parece funcionar y otras no, y ese es justo el tipo de error que cuesta encontrar.

## Las clases envoltorio

Cada primitivo tiene una clase que lo "envuelve" en un objeto:

| Primitivo | Envoltorio |
| --- | --- |
| `int` | `Integer` |
| `double` | `Double` |
| `boolean` | `Boolean` |
| `char` | `Character` |
| `long` | `Long` |

> [!analogia]
> Un envoltorio es como meter un número en un sobre con instrucciones de uso. El número es el mismo, pero el sobre trae herramientas extra (`Integer.MAX_VALUE`, `Character.isDigit`…) y se puede guardar donde solo se admiten objetos.

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

> [!idea]
> `"36"` y `36` no son lo mismo: el primero es un texto y el segundo un número. `Integer.parseInt` convierte el texto en número; `String.valueOf`, al revés.

Si el texto no es un número válido, `parseInt` lanza una `NumberFormatException`. Aprenderás a manejarla en el módulo de Excepciones.

## null

Una variable de tipo objeto (como `String` o `Integer`) puede valer `null`: "no apunta a ningún objeto". Llamar a un método sobre `null` produce una `NullPointerException`. Los primitivos nunca son `null`.

> [!resumen]
> - `String` es una clase; `char` es un primitivo de un carácter.
> - Compara textos con `equals`, nunca con `==`.
> - Cada primitivo tiene un envoltorio (`Integer`, `Double`…) y Java convierte solo entre ambos.
> - `Integer.parseInt` y `Double.parseDouble` convierten texto en número; `String.valueOf`, al revés.
