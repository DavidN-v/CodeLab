Hasta ahora has escrito programas como una lista de instrucciones dentro de `main`, quizá repartidas en métodos. Funciona para programas pequeños. Pero piensa en una aplicación de banco con clientes, cuentas, tarjetas y movimientos: ¿dónde guardas el saldo de cada cuenta?, ¿quién se asegura de que nunca sea negativo?

## El problema de los datos sueltos

```java
public class Main {
    public static void main(String[] args) {
        String titular1 = "Ada";
        double saldo1 = 100;
        String titular2 = "Grace";
        double saldo2 = 50;

        saldo1 -= 300;   // nada impide dejar la cuenta en negativo
        System.out.println(titular1 + ": " + saldo1);
        System.out.println(titular2 + ": " + saldo2);
    }
}
```

Los datos de una cuenta están dispersos en variables que solo se relacionan por su nombre, y cualquier línea del programa puede ponerlas en un estado absurdo.

## La idea: objetos

La **programación orientada a objetos** (POO) agrupa en una sola pieza:

- **Estado:** los datos que la describen (titular, saldo).
- **Comportamiento:** lo que puede hacer (ingresar, retirar), y que mantiene ese estado válido.

```java
class Cuenta {
    String titular;
    double saldo;

    void retirar(double cantidad) {
        if (cantidad <= saldo) {
            saldo -= cantidad;
        } else {
            System.out.println("Saldo insuficiente en la cuenta de " + titular);
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Cuenta cuenta = new Cuenta();
        cuenta.titular = "Ada";
        cuenta.saldo = 100;
        cuenta.retirar(300);
        cuenta.retirar(30);
        System.out.println(cuenta.titular + ": " + cuenta.saldo);
    }
}
```

Ahora la regla "no se puede retirar más de lo que hay" vive **dentro** de la cuenta, en un solo sitio.

## Los cuatro pilares

Vas a oír hablar de estas cuatro ideas; cada una tiene su módulo en el curso:

| Pilar | Idea | Módulo |
| --- | --- | --- |
| **Encapsulación** | Cada objeto protege su estado y solo deja tocarlo a través de sus métodos | Este y Clases |
| **Abstracción** | Usas un objeto por lo que hace, sin conocer cómo lo hace | Interfaces |
| **Herencia** | Una clase puede especializar a otra y reutilizar su código | Herencia |
| **Polimorfismo** | Distintos objetos responden al mismo mensaje cada uno a su manera | Polimorfismo |

## Ya has usado objetos

`String`, `Scanner` y `StringBuilder` son clases, y cada vez que escribes `new Scanner(System.in)` creas un objeto. Cuando llamas a `nombre.toUpperCase()` le pides a un objeto `String` que haga algo. No sabes cómo está implementado por dentro, y no te hace falta: eso es abstracción.

## Pensar en objetos

Para diseñar un programa orientado a objetos, pregúntate:

1. ¿Qué **cosas** hay en el problema? (sustantivos: alumno, curso, nota) → posibles clases.
2. ¿Qué **datos** tiene cada una? → campos.
3. ¿Qué **acciones** hace o le piden? (verbos: matricular, calificar) → métodos.
4. ¿Qué **reglas** debe cumplir siempre? (una nota está entre 0 y 10) → las protegen sus métodos.

## Resumen

- La POO agrupa estado y comportamiento en objetos.
- Las reglas sobre los datos viven junto a los datos, en un único sitio.
- Encapsulación, abstracción, herencia y polimorfismo son sus cuatro ideas centrales.
- Ya usas objetos: `String`, `Scanner`, `StringBuilder`.
