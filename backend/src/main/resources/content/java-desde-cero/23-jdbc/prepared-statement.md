## El peligro de concatenar SQL

Imagina buscar un usuario a partir de lo que escribe alguien en un formulario:

```java fragment
String sql = "SELECT * FROM usuarios WHERE nombre = '" + nombre + "'";
```

Si `nombre` es `x' OR '1'='1`, la consulta se convierte en:

```
SELECT * FROM usuarios WHERE nombre = 'x' OR '1'='1'
```

que devuelve **todos** los usuarios. Con otras entradas un atacante podría borrar tablas. Es la **inyección SQL**, una de las vulnerabilidades más explotadas de la historia.

## PreparedStatement

La solución es no meter nunca datos dentro del texto SQL. Se escribe la consulta con `?` en el lugar de cada dato y se pasan los valores aparte:

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class Main {
    public static void main(String[] args) throws SQLException {
        try (Connection c = DriverManager.getConnection("jdbc:h2:mem:usuarios")) {
            try (Statement s = c.createStatement()) {
                s.execute("CREATE TABLE usuarios (nombre VARCHAR(30), rol VARCHAR(10))");
                s.execute("INSERT INTO usuarios VALUES ('ada', 'admin'), ('alan', 'alumno')");
            }

            String intentoMalicioso = "x' OR '1'='1";
            try (PreparedStatement consulta = c.prepareStatement("SELECT rol FROM usuarios WHERE nombre = ?")) {
                consulta.setString(1, intentoMalicioso);
                try (ResultSet r = consulta.executeQuery()) {
                    System.out.println(r.next() ? "Encontrado" : "Nadie se llama así");   // Nadie se llama así
                }
                consulta.setString(1, "ada");
                try (ResultSet r = consulta.executeQuery()) {
                    if (r.next()) {
                        System.out.println("ada es " + r.getString("rol"));
                    }
                }
            }
        }
    }
}
```

- `prepareStatement(sql)` compila la consulta con sus huecos `?`.
- `setString(1, valor)`, `setInt(2, valor)`… rellenan los huecos, numerados desde 1.
- El valor viaja como **dato**, nunca como código SQL: la comilla del intento malicioso es solo un carácter más del nombre buscado.
- Se puede reutilizar cambiando los parámetros, y la base de datos no tiene que volver a analizar la consulta.

> **Regla de oro:** cualquier valor que venga de fuera de tu código (usuario, archivo, red) va siempre como parámetro de un `PreparedStatement`.

## Insertar y recuperar el id generado

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class Main {
    public static void main(String[] args) throws SQLException {
        try (Connection c = DriverManager.getConnection("jdbc:h2:mem:tareas")) {
            try (Statement s = c.createStatement()) {
                s.execute("CREATE TABLE tareas (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(100), hecha BOOLEAN)");
            }
            String sql = "INSERT INTO tareas (titulo, hecha) VALUES (?, ?)";
            try (PreparedStatement insertar = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                for (String titulo : new String[] {"Estudiar JDBC", "Hacer ejercicios"}) {
                    insertar.setString(1, titulo);
                    insertar.setBoolean(2, false);
                    insertar.executeUpdate();
                    try (ResultSet claves = insertar.getGeneratedKeys()) {
                        claves.next();
                        System.out.println("Creada la tarea " + claves.getInt(1) + ": " + titulo);
                    }
                }
            }
        }
    }
}
```

## Valores nulos

Para guardar `NULL` usa `setNull(indice, Types.VARCHAR)`. Al leer, `getInt` devuelve 0 para un `NULL`; para distinguirlo, llama después a `wasNull()` o usa `getObject("col", Integer.class)`, que devuelve `null`.

## Resumen

- Concatenar datos en el SQL abre la puerta a la inyección SQL.
- `PreparedStatement` con `?` y `setXxx(indice, valor)` separa código y datos.
- `RETURN_GENERATED_KEYS` + `getGeneratedKeys()` devuelve los ids generados.
