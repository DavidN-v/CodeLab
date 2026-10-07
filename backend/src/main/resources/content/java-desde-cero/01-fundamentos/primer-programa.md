Este es el programa más pequeño que hace algo visible en Java:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hola, mundo!");
    }
}
```

Pulsa **Abrir en el playground** sobre el código y ejecútalo. En la consola aparece `Hola, mundo!`. ¡Enhorabuena, ya has ejecutado tu primer programa! Ahora veamos qué significa cada parte.

> [!prueba]
> Cambia `"Hola, mundo!"` por `"Hola, soy <tu nombre>"` (con tu nombre de verdad) y vuelve a ejecutar. Acabas de escribir tu primer cambio en un programa.

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

> [!analogia]
> Un programa Java es como una caja con cajas dentro. La clase es la caja grande; el método `main` es una caja más pequeña dentro de ella; y dentro de `main` van las instrucciones. Cada `{` abre una caja y cada `}` la cierra.

> [!cuidado]
> Si una clase es `public`, el archivo debe llamarse exactamente igual que ella: la clase `Main` vive en `Main.java`. En esta plataforma el archivo se nombra solo a partir de tu clase pública, así que aquí no tienes que preocuparte.

Por convención los nombres de clase empiezan en mayúscula y usan *PascalCase* (cada palabra empieza en mayúscula): `Main`, `CuentaBancaria`.

## El método main

```java fragment
public static void main(String[] args) {
    ...
}
```

Un **método** es un bloque de código con nombre. El método `main` es especial: es el **punto de entrada**, lo primero que ejecuta la JVM. Su primera línea tiene que ser exactamente esta:

| Parte | Significado |
| --- | --- |
| `public` | La JVM tiene que poder llamarlo desde fuera |
| `static` | Se puede ejecutar sin crear un objeto de la clase |
| `void` | No devuelve ningún valor |
| `main` | El nombre que la JVM busca |
| `String[] args` | Los argumentos de la línea de comandos (no los usaremos de momento) |

> [!analogia]
> `main` es la puerta de entrada de una casa: la JVM siempre entra por ahí. Si la puerta tiene otro nombre (`Main`, `inicio`…), la JVM no la encuentra y no sabe por dónde empezar.

No hace falta que memorices esta línea: la copiarás tal cual en cada programa y, con el tiempo, entenderás cada palabra.

## La instrucción

```java fragment
System.out.println("Hola, mundo!");
```

- `System.out` es la **salida estándar**: la consola.
- `println` escribe un texto y añade un salto de línea al final.
- `"Hola, mundo!"` es un **literal de texto** (un `String`): va siempre entre comillas dobles.
- El **punto y coma** `;` termina cada instrucción, como el punto final de una frase.

> [!cuidado]
> Olvidar el punto y coma es el error más frecuente al empezar. Si el compilador dice `';' expected`, mira el final de la línea que te indica.

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

> [!prueba]
> Mueve la línea de `"Tercero"` para que quede la primera y ejecuta. El orden de la salida cambia con el orden del código.

## Compilar y ejecutar fuera de la plataforma

Cuando instales el JDK en tu ordenador, harás lo mismo que hace el botón **Ejecutar**:

```
javac Main.java     ← compila y crea Main.class
java Main           ← ejecuta la clase Main
```

Desde Java 11 también puedes ejecutar un único archivo directamente: `java Main.java`.

## Mayúsculas, espacios y sangría

- Java **distingue mayúsculas de minúsculas**: `System` no es lo mismo que `system`, ni `Main` que `main`.
- Los espacios y saltos de línea no importan al compilador, pero sí a las personas. La **sangría** (4 espacios por nivel) muestra qué está dentro de qué.

> [!resumen]
> - Un programa Java es, como mínimo, una clase con un método `main`.
> - `main` es el punto de entrada y sus instrucciones se ejecutan en orden, de arriba abajo.
> - `System.out.println(...)` escribe una línea en la consola.
> - Cada instrucción termina en `;`, y Java distingue mayúsculas de minúsculas.
