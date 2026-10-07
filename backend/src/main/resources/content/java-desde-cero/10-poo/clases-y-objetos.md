## La clase es el molde

Una **clase** describe cómo son y qué saben hacer los objetos de un tipo. Un **objeto** (o instancia) es una pieza concreta creada a partir de ese molde. Una clase `Perro` hay una; perros, tantos como crees.

```java
class Perro {
    // Campos: el estado de cada perro
    String nombre;
    int edad;

    // Métodos: su comportamiento
    void ladrar() {
        System.out.println(nombre + " dice: ¡Guau!");
    }

    int edadHumana() {
        return edad * 7;
    }
}

public class Main {
    public static void main(String[] args) {
        Perro toby = new Perro();
        toby.nombre = "Toby";
        toby.edad = 3;

        Perro luna = new Perro();
        luna.nombre = "Luna";
        luna.edad = 5;

        toby.ladrar();
        luna.ladrar();
        System.out.println(luna.nombre + " tiene " + luna.edadHumana() + " años humanos");
    }
}
```

- Los **campos** (atributos) se declaran dentro de la clase, fuera de los métodos.
- `new Perro()` crea un objeto nuevo en memoria.
- El operador **punto** accede a los campos y métodos de un objeto concreto: `toby.nombre`, `luna.ladrar()`.
- Cada objeto tiene **sus propios** valores: cambiar el nombre de `toby` no afecta a `luna`.

Fíjate en que los métodos de `Perro` **no** llevan `static`: pertenecen a cada perro, y dentro de ellos `nombre` se refiere al nombre del perro sobre el que se llamó.

## Varias clases en un archivo

En un proyecto real cada clase pública va en su propio archivo (`Perro.java`, `Main.java`). En esta plataforma trabajas en un único archivo, así que pon las clases auxiliares **sin** `public` antes o después de la clase `Main`. Así lo harán todos los ejercicios de estos módulos.

## Valores por defecto

Los campos que no inicializas toman el valor por defecto de su tipo: `0`, `0.0`, `false` o `null`. A diferencia de las variables locales, Java no te obliga a darles valor, lo que puede dejar objetos a medio construir (un perro sin nombre). En el siguiente módulo verás los **constructores**, que resuelven este problema.

## Objetos en arrays

Un array puede guardar objetos, y se recorre como cualquier otro:

```java
class Producto {
    String nombre;
    double precio;
}

public class Main {
    public static void main(String[] args) {
        Producto[] carrito = new Producto[2];
        carrito[0] = new Producto();
        carrito[0].nombre = "Libro";
        carrito[0].precio = 18.5;
        carrito[1] = new Producto();
        carrito[1].nombre = "Lápiz";
        carrito[1].precio = 0.9;

        double total = 0;
        for (Producto p : carrito) {
            total += p.precio;
        }
        System.out.println("Total: " + total);
    }
}
```

`new Producto[2]` crea el array, pero sus dos posiciones valen `null` hasta que creas los productos.

## Resumen

- La clase define campos (estado) y métodos (comportamiento); `new` crea objetos.
- El punto accede al estado y al comportamiento de un objeto concreto.
- Cada objeto tiene sus propios valores de los campos.
- En un único archivo, las clases auxiliares van sin `public`.
