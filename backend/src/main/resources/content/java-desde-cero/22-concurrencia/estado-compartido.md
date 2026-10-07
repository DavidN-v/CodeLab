Los hilos de un programa comparten la memoria: pueden leer y modificar los mismos objetos. Ahí empiezan los problemas.

## Una condición de carrera

```java
public class Main {
    static int contador = 0;

    public static void main(String[] args) throws InterruptedException {
        Runnable sumarMil = () -> {
            for (int i = 0; i < 100_000; i++) {
                contador++;
            }
        };
        Thread a = new Thread(sumarMil);
        Thread b = new Thread(sumarMil);
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(contador);   // debería ser 200000…
    }
}
```

Casi nunca imprime 200 000. `contador++` parece una operación, pero son tres: **leer** el valor, **sumar** 1 y **escribir**. Si los dos hilos leen el mismo valor antes de que ninguno escriba, uno de los incrementos se pierde. Eso es una **condición de carrera**: el resultado depende del orden exacto en que se intercalan los hilos.

Lo peor de estos errores es que son intermitentes: el programa puede funcionar mil veces y fallar en producción.

## synchronized

`synchronized` garantiza que solo un hilo a la vez ejecute un bloque o método sobre el mismo objeto:

```java
class Contador {
    private int valor = 0;

    synchronized void incrementar() {
        valor++;
    }

    synchronized int valor() {
        return valor;
    }
}

public class Main {
    public static void main(String[] args) throws InterruptedException {
        Contador contador = new Contador();
        Runnable tarea = () -> {
            for (int i = 0; i < 100_000; i++) {
                contador.incrementar();
            }
        };
        Thread a = new Thread(tarea);
        Thread b = new Thread(tarea);
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(contador.valor());   // siempre 200000
    }
}
```

Cada objeto tiene un **cerrojo** (*lock*). Un hilo que entra en un método `synchronized` lo toma; los demás esperan a que lo suelte.

## Clases atómicas

Para contadores y valores sueltos, `java.util.concurrent.atomic` ofrece operaciones atómicas sin cerrojos explícitos:

```java
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger contador = new AtomicInteger();
        Runnable tarea = () -> {
            for (int i = 0; i < 100_000; i++) {
                contador.incrementAndGet();
            }
        };
        Thread a = new Thread(tarea);
        Thread b = new Thread(tarea);
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(contador.get());
    }
}
```

## Colecciones concurrentes

`ArrayList` y `HashMap` no son seguras con varios hilos escribiendo. Para eso existen `ConcurrentHashMap`, `CopyOnWriteArrayList` y las colas de `java.util.concurrent`:

```java fragment
Map<String, Integer> visitas = new ConcurrentHashMap<>();
visitas.merge(pagina, 1, Integer::sum);   // seguro desde varios hilos
```

## La mejor defensa: no compartir

La forma más fiable de evitar carreras es **no compartir estado mutable**: que cada hilo trabaje con sus propios datos y devuelva un resultado, y combinar los resultados al final. Los objetos inmutables (records, `String`) se pueden compartir sin peligro. Es justo lo que hacen los ejecutores de la siguiente lección.

## Resumen

- Varios hilos modificando el mismo dato sin protección provocan condiciones de carrera.
- `synchronized` deja pasar a un solo hilo a la vez por objeto.
- `AtomicInteger` y compañía, y las colecciones concurrentes, para casos comunes.
- Mejor aún: no compartas estado mutable.
