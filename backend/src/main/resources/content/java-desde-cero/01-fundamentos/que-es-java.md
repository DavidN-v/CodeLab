Java es un **lenguaje de programación**: una forma de escribir instrucciones que un ordenador puede seguir. Nació en 1995 en Sun Microsystems con una promesa que sigue definiéndolo: *escríbelo una vez, ejecútalo en cualquier parte*.

Hoy está detrás de aplicaciones bancarias, sistemas de reservas, el backend de muchas empresas (casi siempre con Spring), aplicaciones Android, herramientas como IntelliJ IDEA y servidores de juegos como Minecraft. Aprenderlo es una muy buena primera elección.

## Cómo llega tu código a ejecutarse

En lenguajes como C, el compilador traduce tu programa directamente a instrucciones del procesador. Ese ejecutable solo funciona en el sistema para el que se compiló. Java hace algo distinto, en dos pasos:

1. **Compilar.** El compilador `javac` lee tu archivo `.java` y genera un archivo `.class` con **bytecode**: instrucciones para una máquina que no existe físicamente.
2. **Ejecutar.** La **JVM** (Java Virtual Machine, la "máquina virtual de Java") lee ese bytecode y lo ejecuta en tu sistema. Existe una JVM para Windows, otra para Linux, otra para macOS…

```
Hola.java  ──javac──►  Hola.class  ──java──►  JVM  ──►  tu procesador
(código)               (bytecode)
```

> [!analogia]
> Imagina que escribes una receta en un idioma universal que nadie habla en casa. En cada cocina del mundo (Windows, Linux, macOS) hay un intérprete que la entiende y la traduce al idioma local. El bytecode es esa receta universal; la JVM es el intérprete de cada cocina.

Como el bytecode es el mismo en todas partes, el mismo `.class` funciona en cualquier sistema que tenga una JVM. Esa es la **portabilidad** de Java.

> [!idea]
> Tú escribes código Java; `javac` lo convierte en bytecode; la JVM lo ejecuta en cualquier ordenador.

Un detalle curioso: la JVM no se limita a leer el bytecode. Detecta las partes de tu programa que más se repiten y las traduce al vuelo a código del procesador (compilación *JIT*). Por eso Java es rápido en programas que corren mucho tiempo.

## JDK, JRE y JVM

Vas a ver estas siglas a menudo:

| Sigla | Qué es | Para qué la necesitas |
| --- | --- | --- |
| **JVM** | La máquina virtual que ejecuta bytecode | Siempre, es la que corre el programa |
| **JRE** | JVM + bibliotecas estándar | Para *ejecutar* programas Java |
| **JDK** | JRE + herramientas (`javac`, `jar`, depurador…) | Para *desarrollar* en Java |

> [!analogia]
> La JVM es el motor, el JRE es el coche completo listo para conducir, y el JDK es el taller entero: el coche más todas las herramientas para construir y arreglar coches.

Para programar necesitas el **JDK**. En esta plataforma no tienes que instalar nada: cada vez que pulsas **Ejecutar**, tu código se compila con `javac` y se ejecuta con `java` en un entorno aislado, igual que en tu ordenador.

Este pequeño programa pregunta a la JVM qué versión de Java está usando. Ejecútalo: todavía no entiendes cada palabra, y no pasa nada.

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Estoy usando Java " + System.getProperty("java.version"));
    }
}
```

> [!prueba]
> Cambia el texto `"Estoy usando Java "` por `"Mi versión de Java es "` y vuelve a ejecutar. ¿Ves cómo cambia solo lo que está entre comillas?

## Las versiones de Java

Java publica una versión nueva cada seis meses y, cada dos años, una versión **LTS** (soporte a largo plazo) que es la que usan las empresas. Este curso usa **Java 21**, una LTS con mejoras modernas como los `record`, el `switch` con flechas y los bloques de texto. Casi todo lo que aprendas sirve también en versiones anteriores.

## Las características que más notarás

- **Tipado estático.** Cada dato tiene un tipo fijo (número, texto…) que el compilador comprueba antes de ejecutar nada. Muchos errores aparecen al compilar, no cuando tu programa ya está en marcha.
- **Orientado a objetos.** Todo el código vive dentro de *clases*. Lo verás desde el primer programa; las clases en profundidad llegan más adelante.
- **Memoria automática.** No liberas memoria a mano: el *recolector de basura* elimina lo que ya no se usa.
- **Una biblioteca estándar enorme.** Fechas, ficheros, red, colecciones… Mucho de lo que necesitas ya está escrito.

No te preocupes si ahora hay palabras que no te dicen nada (*clase*, *método*, *static*): las irás encontrando en su momento, cada una con su explicación.

> [!resumen]
> - Java compila tu código a **bytecode** y la **JVM** lo ejecuta en cualquier sistema.
> - Para programar necesitas el **JDK**; aquí ya está todo listo.
> - El compilador revisa tu código antes de ejecutarlo y te avisa de muchos errores.
