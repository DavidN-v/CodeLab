Un objeto recién creado con campos a `null` o a `0` es un objeto a medio hacer. Un **constructor** es un bloque especial que se ejecuta al hacer `new` y deja el objeto listo y válido.

## Declarar un constructor

```java
class Alumno {
    private String nombre;
    private int edad;

    Alumno(String nombre, int edad) {
        this.nombre = nombre;
        this.edad = edad;
    }

    String presentarse() {
        return "Soy " + nombre + " y tengo " + edad + " años";
    }
}

public class Main {
    public static void main(String[] args) {
        Alumno ada = new Alumno("Ada", 36);
        System.out.println(ada.presentarse());
    }
}
```

- Se llama **exactamente igual que la clase**.
- **No** tiene tipo de retorno (ni siquiera `void`).
- Sus parámetros son los datos que exiges para crear el objeto: ya no hay alumnos sin nombre.

## this

Dentro de la clase, `this` es una referencia al propio objeto. Se usa sobre todo para distinguir el campo del parámetro cuando se llaman igual: `this.nombre = nombre;` significa "guarda en **mi** campo `nombre` el parámetro `nombre`".

## Validar en el constructor

El constructor es el lugar ideal para impedir objetos inválidos:

```java
class Temperatura {
    private final double kelvin;

    Temperatura(double kelvin) {
        if (kelvin < 0) {
            throw new IllegalArgumentException("Por debajo del cero absoluto: " + kelvin);
        }
        this.kelvin = kelvin;
    }

    double enCelsius() {
        return kelvin - 273.15;
    }
}

public class Main {
    public static void main(String[] args) {
        Temperatura t = new Temperatura(300);
        System.out.printf("%.2f%n", t.enCelsius());
        new Temperatura(-5);   // lanza IllegalArgumentException
    }
}
```

`throw` lanza una excepción y detiene la creación. Lo verás a fondo en el módulo de Excepciones; por ahora quédate con que es la forma correcta de rechazar datos imposibles.

## Varios constructores

Una clase puede tener varios constructores (sobrecarga). Con `this(...)` uno puede llamar a otro, evitando repetir código:

```java
class Rectangulo {
    private final int ancho;
    private final int alto;

    Rectangulo(int ancho, int alto) {
        this.ancho = ancho;
        this.alto = alto;
    }

    Rectangulo(int lado) {
        this(lado, lado);   // un cuadrado es un rectángulo con lados iguales
    }

    int area() {
        return ancho * alto;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Rectangulo(3, 4).area());
        System.out.println(new Rectangulo(5).area());
    }
}
```

`this(...)` debe ser la primera instrucción del constructor.

## El constructor por defecto

Si no escribes ningún constructor, Java crea uno vacío sin parámetros: por eso `new Perro()` funcionaba en el módulo anterior. En cuanto declaras uno con parámetros, ese constructor por defecto **desaparece**: si también quieres `new Rectangulo()`, tienes que escribirlo.

## Campos final

Un campo `final` debe recibir valor en el constructor (o en su declaración) y no puede cambiar después. Los objetos cuyos campos son todos `final` se llaman **inmutables**, como `String`: son más fáciles de razonar porque nunca cambian a tus espaldas.

## Resumen

- El constructor se llama como la clase, no tiene tipo de retorno y se ejecuta con `new`.
- `this.campo = parametro` distingue el campo del parámetro.
- Valida en el constructor y lanza `IllegalArgumentException` ante datos imposibles.
- `this(...)` encadena constructores; `final` hace campos que no cambian.
