Los modificadores de acceso deciden **quién** puede usar cada campo, método o clase. Son la herramienta de la encapsulación.

> [!analogia]
> Piensa en una casa: el salón es `public` (entra cualquier visita), la cocina es de acceso de paquete (solo la familia), y el diario del cajón es `private` (solo tú).

## Los cuatro niveles

| Modificador | Accesible desde |
| --- | --- |
| `public` | Cualquier parte |
| `protected` | El mismo paquete y las subclases |
| *(ninguno)* | El mismo paquete ("acceso de paquete") |
| `private` | Solo la propia clase |

Un **paquete** es una carpeta de clases relacionadas (`com.forja.banco`). En los ejercicios todo está en el mismo archivo y paquete, así que el acceso de paquete funciona como si fuera público; en un proyecto real la diferencia importa.

## La regla general

- **Campos:** `private` casi siempre.
- **Métodos** que forman la "interfaz" de la clase: `public`.
- **Métodos auxiliares** internos: `private`.

```java
class Contrasena {
    private final String valor;

    public Contrasena(String valor) {
        if (!esSegura(valor)) {
            throw new IllegalArgumentException("Contraseña demasiado débil");
        }
        this.valor = valor;
    }

    public boolean coincide(String intento) {
        return valor.equals(intento);
    }

    private static boolean esSegura(String texto) {
        return texto.length() >= 8 && texto.chars().anyMatch(Character::isDigit);
    }
}

public class Main {
    public static void main(String[] args) {
        Contrasena clave = new Contrasena("forja2026");
        System.out.println(clave.coincide("forja2026"));
        System.out.println(clave.coincide("otra"));
    }
}
```

Nadie de fuera puede leer `valor` ni llamar a `esSegura`: solo puede preguntar si un intento coincide. (Ese `texto.chars().anyMatch(...)` es un stream; llegarán en su módulo.)

> [!prueba]
> Cambia `"forja2026"` por `"corta"` en el `new Contrasena(...)` y ejecuta: ¿qué pasa al crear el objeto?

## Getters y setters

Por convención, el método que lee un campo `x` se llama `getX()` (o `isX()` si es `boolean`) y el que lo cambia `setX(...)`:

> [!analogia]
> Un getter es la ventanilla de información: te dice un dato sin dejarte tocarlo. Un setter es la ventanilla de cambios: antes de aceptar algo, el funcionario lo revisa.

```java
class Persona {
    private String nombre;
    private int edad;
    private boolean socio;

    public Persona(String nombre, int edad) {
        this.nombre = nombre;
        setEdad(edad);
    }

    public String getNombre() {
        return nombre;
    }

    public int getEdad() {
        return edad;
    }

    public void setEdad(int edad) {
        if (edad < 0 || edad > 150) {
            throw new IllegalArgumentException("Edad no válida: " + edad);
        }
        this.edad = edad;
    }

    public boolean isSocio() {
        return socio;
    }

    public void hacerSocio() {
        socio = true;
    }
}

public class Main {
    public static void main(String[] args) {
        Persona p = new Persona("Grace", 40);
        p.setEdad(41);
        p.hacerSocio();
        System.out.println(p.getNombre() + ", " + p.getEdad() + ", socio: " + p.isSocio());
    }
}
```

Fíjate en tres decisiones:

- `setEdad` **valida**: un setter que asigna sin más no protege nada.
- `nombre` no tiene setter: no se puede cambiar.
- En lugar de `setSocio(true)` hay un método con significado, `hacerSocio()`.

> [!cuidado]
> No generes getters y setters para todos los campos por costumbre. Cada setter es una puerta para cambiar el estado; abre solo las necesarias.

## Clases públicas y archivos

Una clase `public` debe estar en un archivo con su mismo nombre, y solo puede haber una por archivo. Por eso en los ejercicios solo `Main` es pública.

> [!resumen]
> - `private` para campos y métodos internos; `public` para lo que forma parte del uso de la clase.
> - Getters `getX`/`isX` y setters `setX`, solo cuando hacen falta.
> - Los setters validan; mejor aún, métodos con nombre de acción.
