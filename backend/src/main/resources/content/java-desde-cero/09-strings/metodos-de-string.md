Casi todos los programas manipulan texto: nombres, mensajes, ficheros, datos que llegan de la red. La clase `String` trae decenas de métodos; estos son los que usarás a diario.

## Consultar

```java
public class Main {
    public static void main(String[] args) {
        String frase = "Aprender Java es divertido";
        System.out.println(frase.length());              // 26
        System.out.println(frase.charAt(0));             // 'A'
        System.out.println(frase.indexOf("Java"));       // 9
        System.out.println(frase.indexOf("Python"));     // -1: no está
        System.out.println(frase.lastIndexOf('e'));      // última 'e'
        System.out.println(frase.contains("es"));        // true
        System.out.println(frase.startsWith("Apr"));     // true
        System.out.println(frase.endsWith("."));         // false
        System.out.println("".isEmpty() + " " + "   ".isBlank());
    }
}
```

Como en los arrays, las posiciones empiezan en 0 y la última es `length() - 1`.

## Extraer

`substring(inicio, fin)` devuelve el trozo desde `inicio` **incluido** hasta `fin` **excluido**:

```java
public class Main {
    public static void main(String[] args) {
        String correo = "ada@forja.dev";
        int arroba = correo.indexOf('@');
        String usuario = correo.substring(0, arroba);
        String dominio = correo.substring(arroba + 1);   // hasta el final
        System.out.println(usuario + " | " + dominio);
    }
}
```

## Transformar

Cada uno de estos métodos devuelve un String **nuevo**:

```java
public class Main {
    public static void main(String[] args) {
        String texto = "  Hola Mundo  ";
        System.out.println("[" + texto.strip() + "]");         // quita espacios de los extremos
        System.out.println(texto.toUpperCase());
        System.out.println(texto.toLowerCase());
        System.out.println(texto.replace("Mundo", "Java"));
        System.out.println("ja".repeat(3));                    // jajaja
    }
}
```

`strip()` es la versión moderna de `trim()` y entiende todos los espacios Unicode.

## Comparar

```java
public class Main {
    public static void main(String[] args) {
        String a = "Java";
        String b = "java";
        System.out.println(a.equals(b));             // false
        System.out.println(a.equalsIgnoreCase(b));   // true
        System.out.println("ana".compareTo("beto")); // negativo: "ana" va antes
        System.out.println("beto".compareTo("ana")); // positivo
        System.out.println("ana".compareTo("ana"));  // 0
    }
}
```

`compareTo` sirve para ordenar alfabéticamente: devuelve un número negativo, cero o positivo.

## Recorrer los caracteres

```java
public class Main {
    public static void main(String[] args) {
        String palabra = "Programación";
        int mayusculas = 0;
        for (int i = 0; i < palabra.length(); i++) {
            char c = palabra.charAt(i);
            if (Character.isUpperCase(c)) {
                mayusculas++;
            }
        }
        System.out.println("Mayúsculas: " + mayusculas);

        for (char c : palabra.toCharArray()) {
            System.out.print(c + "-");
        }
        System.out.println();
    }
}
```

La clase `Character` ayuda a clasificar caracteres: `isLetter`, `isDigit`, `isWhitespace`, `isUpperCase`, `toLowerCase`…

## Resumen

- Consultar: `length`, `charAt`, `indexOf`, `contains`, `startsWith`, `isBlank`.
- Extraer: `substring(inicio, fin)` con `fin` excluido.
- Transformar: `strip`, `toUpperCase`, `toLowerCase`, `replace`, `repeat`; siempre devuelven un String nuevo.
- Comparar con `equals`, `equalsIgnoreCase` y `compareTo`.
