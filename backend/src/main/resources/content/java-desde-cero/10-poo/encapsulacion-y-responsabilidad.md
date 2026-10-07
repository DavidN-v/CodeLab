## El problema de los campos abiertos

En la lección anterior cualquiera podía hacer `cuenta.saldo = -1000`. La **encapsulación** consiste en ocultar el estado y exponer solo operaciones que lo mantienen válido.

> [!analogia]
> Piensa en una hucha: el dinero está dentro y no puedes cogerlo con la mano. Solo hay una ranura para meter monedas. La hucha decide qué entra; nadie puede vaciarla «por la puerta de atrás».

## private y los métodos de acceso

```java
class Cuenta {
    private String titular;
    private double saldo;

    void abrir(String nombre) {
        titular = nombre;
    }

    void ingresar(double cantidad) {
        if (cantidad <= 0) {
            System.out.println("La cantidad debe ser positiva");
            return;
        }
        saldo += cantidad;
    }

    boolean retirar(double cantidad) {
        if (cantidad <= 0 || cantidad > saldo) {
            return false;
        }
        saldo -= cantidad;
        return true;
    }

    double getSaldo() {
        return saldo;
    }

    String getTitular() {
        return titular;
    }
}

public class Main {
    public static void main(String[] args) {
        Cuenta cuenta = new Cuenta();
        cuenta.abrir("Ada");
        cuenta.ingresar(100);
        System.out.println(cuenta.retirar(250));   // false
        System.out.println(cuenta.retirar(40));    // true
        System.out.println(cuenta.getTitular() + ": " + cuenta.getSaldo());
        // cuenta.saldo = -1000;   ← no compila: saldo es private
    }
}
```

- `private` hace que el campo solo sea accesible **desde dentro** de la clase.
- Los métodos públicos (aquí sin modificador, accesibles desde el mismo paquete) son la única forma de cambiar el estado, y validan cada cambio.
- Un **getter** (`getSaldo`) es un método que permite leer un campo sin permitir escribirlo.

> [!prueba]
> Quita las dos barras de `// cuenta.saldo = -1000;` y ejecuta: lee el error del compilador. Después prueba `cuenta.ingresar(-5)`.

Fíjate en que no hay `setSaldo`: el saldo solo cambia por ingresos y retiradas. No todo campo necesita un setter (un método que cambia el campo); de hecho, cuantos menos, mejor.

> [!idea]
> Los datos son privados; para cambiarlos hay que pasar por un método que los vigila.

## Responsabilidad única

Cada clase debería tener **una** razón para existir. Un buen diseño reparte el trabajo:

> [!analogia]
> En un restaurante el cocinero cocina, el camarero sirve y el cajero cobra. Si todos hicieran de todo, nadie sabría a quién reclamar cuando algo sale mal.

```java
class Producto {
    private final String nombre;
    private final double precio;

    Producto(String nombre, double precio) {
        this.nombre = nombre;
        this.precio = precio;
    }

    double getPrecio() {
        return precio;
    }

    String getNombre() {
        return nombre;
    }
}

class Carrito {
    private final Producto[] productos = new Producto[10];
    private int cantidad = 0;

    void anadir(Producto producto) {
        productos[cantidad] = producto;
        cantidad++;
    }

    double total() {
        double suma = 0;
        for (int i = 0; i < cantidad; i++) {
            suma += productos[i].getPrecio();
        }
        return suma;
    }
}

public class Main {
    public static void main(String[] args) {
        Carrito carrito = new Carrito();
        carrito.anadir(new Producto("Libro", 18.5));
        carrito.anadir(new Producto("Taza", 6.0));
        System.out.println("Total: " + carrito.total());
    }
}
```

El `Producto` sabe su nombre y precio; el `Carrito` sabe qué productos contiene y cuánto suman. `Main` solo los coordina. (Ese `Producto(String nombre, double precio)` es un constructor: lo verás a fondo en el siguiente módulo.)

## Dile, no preguntes

Una pauta útil: en vez de pedirle datos a un objeto para decidir tú, **pídele que lo haga él**.

```java fragment
// Preguntar y decidir fuera
if (cuenta.getSaldo() >= precio) {
    cuenta.setSaldo(cuenta.getSaldo() - precio);
}

// Decirle lo que quieres
cuenta.retirar(precio);
```

La segunda forma mantiene la regla dentro de `Cuenta` y no la repite por todo el programa.

> [!cuidado]
> Hacer los campos `private` y luego añadir un setter que asigna cualquier cosa sin comprobar nada es como poner candado a la hucha y dejar la llave pegada: no protege nada.

> [!resumen]
> - `private` oculta el estado; los métodos validan cada cambio.
> - Ofrece getters solo para lo que haya que leer, y setters solo si de verdad hacen falta.
> - Cada clase, una responsabilidad.
> - Dile al objeto qué hacer en vez de manipular sus datos desde fuera.
