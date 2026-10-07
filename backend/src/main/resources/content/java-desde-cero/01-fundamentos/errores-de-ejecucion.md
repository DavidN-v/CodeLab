A veces el programa compila sin quejas, arranca… y a mitad de camino se detiene con un mensaje largo en rojo. Es un **error de ejecución**, también llamado **excepción**. Y hay un tercer tipo, más silencioso: el programa termina bien pero hace otra cosa de la que querías.

> [!analogia]
> Compilar es revisar la receta antes de cocinar: "¿están todos los pasos bien escritos?". Un error de ejecución aparece ya cocinando: la receta estaba bien escrita, pero en el paso 3 descubres que no hay huevos. Hasta el paso 2 todo se hizo; en el 3, la cocina se para.

## Leer un error de ejecución

```java
public class Main {
    public static void main(String[] args) {
        int total = 10;
        int personas = 0;
        System.out.println("Antes de dividir");
        System.out.println(total / personas);
        System.out.println("Esto no se imprime");
    }
}
```

```
Antes de dividir
Exception in thread "main" java.lang.ArithmeticException: / by zero
	at Main.main(Main.java:6)
```

- `ArithmeticException` es el **tipo** de excepción ("un problema con una operación matemática"); `/ by zero` es el detalle ("has dividido entre cero").
- La línea `at Main.main(Main.java:6)` es la **traza** (*stack trace*): dónde ocurrió, aquí en la línea 6. Cuando haya varios métodos verás varias líneas `at`; la primera es donde saltó el error.
- Todo lo anterior al error **sí se ejecutó**: por eso aparece `Antes de dividir`.

> [!prueba]
> Cambia `int personas = 0;` por `int personas = 2;` y vuelve a ejecutar. Ahora se imprimen las tres líneas, porque ya no hay división entre cero.

## Excepciones que verás pronto

| Excepción | En palabras sencillas | Causa habitual |
| --- | --- | --- |
| `ArithmeticException` | "Esa cuenta no se puede hacer" | Dividir un entero entre cero |
| `InputMismatchException` | "Esperaba un número y me diste otra cosa" | `nextInt()` encontró texto |
| `NoSuchElementException` | "Me pides leer y ya no queda nada" | Leer más entrada de la que hay |
| `ArrayIndexOutOfBoundsException` | "Esa posición no existe" | Acceder fuera de un array |
| `NullPointerException` | "Me pides usar algo que no existe" | Usar una referencia que vale `null` |

No hace falta memorizarlas: cuando te salga una, vuelve a esta tabla. Las de arrays y `null` las entenderás en sus módulos.

## Cuando se acaba el tiempo

Cada ejecución tiene un límite de tiempo. Si tu programa entra en un bucle infinito (algo que se repite sin parar), la plataforma lo detiene y verás **Tiempo agotado**. Revisa la condición de tus bucles.

## El error más traicionero: el error lógico

El programa compila y termina sin quejarse, pero el resultado no es el que querías:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Media: " + 6 + 8 / 2);
    }
}
```

Querías la media de 6 y 8 (que es 7), pero imprime `Media: 64`. Java no puede saber qué querías tú; solo hace lo que has escrito. Contra estos errores te protegen los **tests** de los ejercicios, que comparan tu salida con la esperada.

> [!cuidado]
> Que un programa no muestre ningún error no significa que esté bien. Comprueba siempre que la salida es la que esperabas.

> [!resumen]
> - Una excepción detiene el programa mientras corre; lo anterior a ella sí se ejecutó.
> - El mensaje dice el **tipo** de excepción, un detalle y la línea en la traza `at ...`.
> - Un programa sin errores también puede estar mal: los tests te lo dirán.
