## Una variable de objeto guarda una referencia

Una variable primitiva guarda el valor en sí: `int x = 5` contiene un 5. Una variable de tipo objeto **no contiene el objeto**: contiene una **referencia**, la dirección donde vive el objeto en memoria.

> [!analogia]
> Una clase es un molde de galletas; los objetos son las galletas. Las galletas están en la bandeja (el montón, *heap*), y tu variable no es una galleta: es una **etiqueta con una flecha** que señala una galleta concreta de la bandeja.

```java
class Caja {
    int valor;
}

public class Main {
    public static void main(String[] args) {
        Caja a = new Caja();
        a.valor = 1;
        Caja b = a;          // copia la referencia: a y b apuntan a la MISMA caja
        b.valor = 99;
        System.out.println(a.valor);   // 99

        int x = 1;
        int y = x;           // copia el valor
        y = 99;
        System.out.println(x);         // 1
    }
}
```

Así está la memoria al final del programa. `a` y `b` guardan la misma referencia (`@1`): dos flechas hacia **una sola** caja. En cambio, `x` e `y` guardan cada una su propio número.

```memoria
stack main
a: @1
b: @1
x: 1
y: 99
heap
@1 Caja: valor=99
```

> [!prueba]
> Cambia `Caja b = a;` por `Caja b = new Caja();` y vuelve a ejecutar: ¿qué imprime ahora `a.valor`? ¿Por qué?

Asignar una variable de objeto a otra **no copia el objeto**; crea un segundo nombre para el mismo. Si quieres una copia independiente, tienes que crearla (`new Caja()` y copiar los campos, o un constructor de copia).

> [!idea]
> `b = a` no copia la galleta: hace que dos etiquetas señalen la misma galleta. Lo que hagas con una, lo ves con la otra.

## Referencias y métodos

> [!analogia]
> Pasar un objeto a un método es como darle a alguien una fotocopia de la dirección de tu casa. Con esa dirección puede ir y pintar tu puerta (modificar el objeto). Pero si tacha la dirección de su papel y escribe otra, tu casa no se mueve.

Como viste en Arrays, un método recibe una copia de la **referencia**. Puede modificar el objeto al que apunta, pero si reasigna su parámetro, solo cambia su copia local:

```java
class Caja {
    int valor;
}

public class Main {
    static void modificar(Caja c) {
        c.valor = 10;        // cambia el objeto compartido
    }

    static void reasignar(Caja c) {
        c = new Caja();      // solo cambia la copia local de la referencia
        c.valor = 20;
    }

    public static void main(String[] args) {
        Caja caja = new Caja();
        modificar(caja);
        System.out.println(caja.valor);   // 10
        reasignar(caja);
        System.out.println(caja.valor);   // sigue siendo 10
    }
}
```

## null

`null` es una referencia que no apunta a ningún objeto. Es el valor por defecto de los campos de tipo objeto y de las posiciones de un `new Tipo[n]`.

> [!analogia]
> `null` es una etiqueta sin flecha: tiene nombre, pero no señala ninguna galleta. Si le pides a esa etiqueta que te dé un mordisco, no hay nada que morder.

Por ejemplo, con `Caja llena = new Caja();` y `Caja vacia = null;`, la memoria queda así: `llena` tiene flecha; `vacia`, no.

```memoria
stack main
llena: @1
vacia: null
heap
@1 Caja: valor=0
```

Usar un `null` como si fuera un objeto lanza la excepción más famosa de Java:

```java
public class Main {
    public static void main(String[] args) {
        String nombre = null;
        System.out.println(nombre == null);    // true: comparar con null sí se puede
        System.out.println(nombre.length());   // NullPointerException
    }
}
```

> [!cuidado]
> `NullPointerException` significa «has usado el punto (`.`) sobre una variable que vale `null`». Mira la línea que indica el error y pregúntate qué variable de esa línea no apunta a nada.

Formas de defenderse:

- **Comprobar antes:** `if (nombre != null && !nombre.isBlank())` (el cortocircuito evita llamar a `isBlank` sobre `null`).
- **No crear objetos a medias:** constructores que exijan los datos necesarios.
- **Validar en la entrada:** `Objects.requireNonNull(valor, "el nombre es obligatorio")` falla pronto y con un mensaje claro.
- **Comparar con el literal delante:** `"si".equals(respuesta)` no falla aunque `respuesta` sea `null`.

## El recolector de basura

Cuando ningún nombre apunta ya a un objeto, este queda inaccesible y el **recolector de basura** de la JVM libera su memoria automáticamente. No tienes que (ni puedes) borrar objetos a mano.

> [!analogia]
> Es como el servicio de limpieza de un restaurante: cuando nadie está sentado ya en una mesa, se llevan los platos solos.

> [!resumen]
> - Una variable de objeto guarda una referencia (una flecha); asignarla no copia el objeto.
> - Los métodos pueden modificar el objeto recibido, pero no la variable del llamador.
> - `null` es una referencia sin objeto: usar el punto sobre ella lanza `NullPointerException`.
> - Los objetos sin ninguna referencia los borra solo el recolector de basura.
