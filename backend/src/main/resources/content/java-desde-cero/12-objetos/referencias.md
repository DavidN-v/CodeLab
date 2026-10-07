## Una variable de objeto guarda una referencia

Una variable primitiva guarda el valor en sí: `int x = 5` contiene un 5. Una variable de tipo objeto **no contiene el objeto**: contiene una **referencia**, la dirección donde vive el objeto en memoria.

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

```
a ──┐
    ├──► [ Caja: valor = 99 ]
b ──┘
```

Asignar una variable de objeto a otra **no copia el objeto**; crea un segundo nombre para el mismo. Si quieres una copia independiente, tienes que crearla (`new Caja()` y copiar los campos, o un constructor de copia).

## Referencias y métodos

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

Formas de defenderse:

- **Comprobar antes:** `if (nombre != null && !nombre.isBlank())` (el cortocircuito evita llamar a `isBlank` sobre `null`).
- **No crear objetos a medias:** constructores que exijan los datos necesarios.
- **Validar en la entrada:** `Objects.requireNonNull(valor, "el nombre es obligatorio")` falla pronto y con un mensaje claro.
- **Comparar con el literal delante:** `"si".equals(respuesta)` no falla aunque `respuesta` sea `null`.

## El recolector de basura

Cuando ningún nombre apunta ya a un objeto, este queda inaccesible y el **recolector de basura** de la JVM libera su memoria automáticamente. No tienes que (ni puedes) borrar objetos a mano.

## Resumen

- Una variable de objeto guarda una referencia; asignarla no copia el objeto.
- Los métodos pueden modificar el objeto recibido, pero no la variable del llamador.
- Llamar a un método sobre `null` lanza `NullPointerException`: comprueba, valida y no dejes objetos a medias.
