Este es el programa más pequeño que hace algo visible en Java:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hola, mundo!");
    }
}
```

Pulsa **Abrir en el playground** sobre el código y ejecútalo. En la consola aparece `Hola, mundo!`. Ahora veamos qué significa cada parte.

## La clase

```java fragment
public class Main {
    ...
}
```

En Java todo el código vive dentro de una **clase**. Por ahora piensa en ella como el contenedor de tu programa.

- `class Main` declara una clase llamada `Main`.
- `public` significa que es accesible desde cualquier parte.
- Las llaves `{ }` marcan dónde empieza y dónde acaba.

> **Regla importante:** si una clase es `public`, el archivo debe llamarse exactamente igual que ella. La clase `Main` vive en `Main.java`; la clase `Calculadora`, en `Calculadora.java`. En esta plataforma el archivo se nombra solo a partir de tu clase pública.

Por convención los nombres de clase empiezan en mayúscula y usan *PascalCase*: `Main`, `CuentaBancaria`, `LectorDeArchivos`.

## El método main

```java fragment
public static void main(String[] args) {
    ...
}
```

Un **método** es un bloque de código con nombre. El método `main` es especial: es el **punto de entrada**, lo primero que ejecuta la JVM. Su firma tiene que ser exactamente esta:

| Parte | Significado |
| --- | --- |
| `public` | La JVM tiene que poder llamarlo desde fuera |
| `static` | Se puede ejecutar sin crear un objeto de la clase |
| `void` | No devuelve ningún valor |
| `main` | El nombre que la JVM busca |
| `String[] args` | Los argumentos de la línea de comandos (no los usaremos de momento) |

Si escribes `Main` con mayúscula, olvidas `static` o cambias los parámetros, el programa compila pero la JVM no encuentra por dónde empezar.

## La instrucción

```java
System.out.println("Hola, mundo!");
```

- `System.out` es la **salida estándar**: la consola.
- `println` escribe un texto y añade un salto de línea al final.
- `"Hola, mundo!"` es un **literal de texto** (un `String`): va siempre entre comillas dobles.
- El **punto y coma** `;` termina cada instrucción. Olvidarlo es el error más frecuente al empezar.

Las instrucciones dentro de `main` se ejecutan **en orden, de arriba abajo**:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Primero");
        System.out.println("Segundo");
        System.out.println("Tercero");
    }
}
```

## Compilar y ejecutar fuera de la plataforma

Cuando instales el JDK en tu ordenador, harás lo mismo que hace el botón **Ejecutar**:

```
javac Main.java     ← compila y crea Main.class
java Main           ← ejecuta la clase Main
```

Desde Java 11 también puedes ejecutar un único archivo sin compilarlo antes a mano: `java Main.java`.

## Mayúsculas, espacios y sangría

- Java **distingue mayúsculas de minúsculas**: `System` no es lo mismo que `system`, ni `Main` que `main`.
- Los espacios y saltos de línea entre instrucciones no importan al compilador, pero sí a las personas. La sangría (4 espacios por nivel) muestra qué está dentro de qué.

## Resumen

- Un programa Java es, como mínimo, una clase con un método `main`.
- `main` es el punto de entrada y sus instrucciones se ejecutan en orden.
- `System.out.println(...)` escribe una línea en la consola.
- Cada instrucción termina en `;`, y Java distingue mayúsculas de minúsculas.
