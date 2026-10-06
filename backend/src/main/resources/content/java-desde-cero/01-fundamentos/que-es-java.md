Java es un lenguaje de programación de propósito general, **orientado a objetos** y **fuertemente tipado**. Nació en 1995 en Sun Microsystems con una promesa que sigue definiéndolo: *escríbelo una vez, ejecútalo en cualquier parte*.

Hoy está detrás de aplicaciones bancarias, sistemas de reservas, el backend de muchas empresas (casi siempre con Spring), aplicaciones Android, herramientas como IntelliJ IDEA y servidores de juegos como Minecraft.

## Cómo llega tu código a ejecutarse

En lenguajes como C, el compilador traduce tu programa directamente a instrucciones del procesador. Ese ejecutable solo funciona en el sistema para el que se compiló. Java hace algo distinto, en dos pasos:

1. **Compilar.** El compilador `javac` lee tu archivo `.java` y genera un archivo `.class` con **bytecode**: instrucciones para una máquina que no existe físicamente.
2. **Ejecutar.** La **JVM** (Java Virtual Machine) lee ese bytecode y lo ejecuta en tu sistema. Existe una JVM para Windows, otra para Linux, otra para macOS…

```
Hola.java  ──javac──►  Hola.class  ──java──►  JVM  ──►  tu procesador
(código)               (bytecode)
```

Como el bytecode es el mismo en todas partes, el mismo `.class` funciona en cualquier sistema que tenga una JVM. Esa es la portabilidad de Java.

> **Dato útil:** la JVM no se limita a interpretar. Detecta las partes de tu programa que más se ejecutan y las compila al vuelo a código nativo (compilación *JIT*). Por eso Java es rápido en programas que corren mucho tiempo.

## JDK, JRE y JVM

Vas a ver estas siglas a menudo:

| Sigla | Qué es | Para qué la necesitas |
| --- | --- | --- |
| **JVM** | La máquina virtual que ejecuta bytecode | Siempre, es la que corre el programa |
| **JRE** | JVM + bibliotecas estándar | Para *ejecutar* programas Java |
| **JDK** | JRE + herramientas (`javac`, `jar`, depurador…) | Para *desarrollar* en Java |

Para programar necesitas el **JDK**. En esta plataforma no tienes que instalar nada: cada vez que pulsas **Ejecutar**, tu código se compila con `javac` y se ejecuta con `java` en un entorno aislado, igual que en tu ordenador.

## Las versiones de Java

Java publica una versión nueva cada seis meses y, cada dos años, una versión **LTS** (soporte a largo plazo) que es la que usan las empresas. Este curso usa **Java 21**, una LTS que incluye mejoras modernas como los `record`, el `switch` con flechas y los bloques de texto. Todo lo que aprendas sirve también en versiones anteriores salvo donde se indique.

## Las características que más notarás

- **Tipado estático.** Cada variable tiene un tipo fijo que el compilador comprueba antes de ejecutar nada. Muchos errores aparecen al compilar, no cuando tu programa ya está en marcha.
- **Orientado a objetos.** Todo el código vive dentro de *clases*. Lo verás desde el primer programa, aunque las clases en profundidad llegan más adelante.
- **Memoria automática.** No liberas memoria a mano: el *recolector de basura* (garbage collector) elimina los objetos que ya no se usan.
- **Una biblioteca estándar enorme.** Colecciones, fechas, ficheros, red, concurrencia… Mucho de lo que necesitas ya está escrito.

## Lo que viene

En la siguiente lección escribirás tu primer programa y entenderás cada una de sus líneas. No te preocupes si ahora hay palabras que no te dicen nada (*clase*, *método*, *static*): las irás encontrando en su momento, cada una con su explicación.
