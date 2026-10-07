Casi todas las aplicaciones guardan sus datos en una base de datos relacional (PostgreSQL, MySQL, Oracle…). **JDBC** (*Java Database Connectivity*) es la API estándar de Java para hablar con ellas, con la misma interfaz para todas.

## Las piezas

| Pieza | Qué es |
| --- | --- |
| **Driver** | Biblioteca del fabricante que traduce JDBC al protocolo de su base de datos |
| **URL de conexión** | Dice qué base de datos y dónde: `jdbc:postgresql://localhost:5432/tienda` |
| `Connection` | Una conexión abierta |
| `Statement` / `PreparedStatement` | Una sentencia SQL a ejecutar |
| `ResultSet` | Las filas que devuelve una consulta |

## H2: una base de datos en memoria

En esta plataforma tienes disponible **H2**, una base de datos escrita en Java que puede vivir en memoria. Es perfecta para aprender y para tests: se crea al conectar y desaparece al terminar el programa. Su URL es `jdbc:h2:mem:<nombre>`.

> Fuera de la plataforma, para usar H2 o cualquier otra base de datos tienes que añadir su driver a tu proyecto (por ejemplo, como dependencia de Maven).

## Tu primera conexión

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class Main {
    public static void main(String[] args) throws SQLException {
        try (Connection conexion = DriverManager.getConnection("jdbc:h2:mem:tienda");
             Statement sentencia = conexion.createStatement()) {

            sentencia.execute("CREATE TABLE productos (id INT PRIMARY KEY, nombre VARCHAR(50), precio DECIMAL(8,2))");
            sentencia.executeUpdate("INSERT INTO productos VALUES (1, 'Taza', 6.50)");
            sentencia.executeUpdate("INSERT INTO productos VALUES (2, 'Libro', 18.00)");

            try (ResultSet filas = sentencia.executeQuery("SELECT nombre, precio FROM productos ORDER BY precio")) {
                while (filas.next()) {
                    System.out.println(filas.getString("nombre") + ": " + filas.getBigDecimal("precio"));
                }
            }
        }
    }
}
```

- `DriverManager.getConnection(url)` abre la conexión (para PostgreSQL añadirías usuario y contraseña).
- `execute` sirve para cualquier SQL; `executeUpdate` para `INSERT`, `UPDATE` y `DELETE` (devuelve cuántas filas cambió); `executeQuery` para `SELECT` (devuelve un `ResultSet`).
- `Connection`, `Statement` y `ResultSet` son **recursos**: ciérralos siempre con try-with-resources.
- Casi todo lanza `SQLException`, una checked exception.

## Recorrer un ResultSet

Un `ResultSet` es un cursor que empieza **antes** de la primera fila. `next()` avanza y devuelve `false` cuando no quedan filas. Para leer cada columna hay un getter por tipo, por nombre o por posición (empezando en 1):

| SQL | Getter |
| --- | --- |
| `INT` | `getInt("col")` |
| `BIGINT` | `getLong` |
| `VARCHAR` | `getString` |
| `DECIMAL` | `getBigDecimal` |
| `BOOLEAN` | `getBoolean` |
| `DATE` | `getObject("col", LocalDate.class)` |

## Contar y agregar

Las funciones de SQL hacen el trabajo en la base de datos, que suele ser mucho más eficiente que traerlo todo a Java:

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class Main {
    public static void main(String[] args) throws SQLException {
        try (Connection c = DriverManager.getConnection("jdbc:h2:mem:notas");
             Statement s = c.createStatement()) {
            s.execute("CREATE TABLE notas (alumno VARCHAR(30), materia VARCHAR(30), nota INT)");
            s.execute("INSERT INTO notas VALUES ('Ada','mates',9), ('Ada','física',7), ('Alan','mates',6)");
            try (ResultSet r = s.executeQuery(
                    "SELECT alumno, COUNT(*) AS n, AVG(nota) AS media FROM notas GROUP BY alumno ORDER BY alumno")) {
                while (r.next()) {
                    System.out.println(r.getString("alumno") + ": " + r.getInt("n") + " notas, media " + r.getDouble("media"));
                }
            }
        }
    }
}
```

## Resumen

- JDBC es la API estándar; cada base de datos aporta su driver.
- `DriverManager.getConnection(url)` → `Statement` → `executeQuery`/`executeUpdate`.
- Recorre el `ResultSet` con `while (filas.next())` y lee con `getInt`, `getString`…
- Cierra conexión, sentencia y resultados con try-with-resources.
