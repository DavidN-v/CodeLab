Casi toda aplicación real maneja fechas: vencimientos, reservas, cumpleaños. El paquete `java.time` (Java 8) es la forma moderna de hacerlo: sus clases son inmutables, claras y no tienen las trampas de las antiguas `Date` y `Calendar`.

Antes de construir el proyecto final te falta una pieza muy práctica: las fechas. Nuestro gestor de tareas las usará para los vencimientos.

> [!analogia]
> Cada clase de `java.time` es como un objeto distinto de tu escritorio: `LocalDate` es la hoja de un calendario (un día, sin hora), `LocalTime` es la esfera de un reloj (una hora, sin día) y `LocalDateTime` es una cita apuntada en la agenda (día y hora).

## Las clases principales

| Clase | Representa | Ejemplo |
| --- | --- | --- |
| `LocalDate` | Una fecha sin hora | 2026-10-07 |
| `LocalTime` | Una hora sin fecha | 18:30 |
| `LocalDateTime` | Fecha y hora, sin zona horaria | 2026-10-07T18:30 |
| `ZonedDateTime` | Fecha y hora en una zona | 2026-10-07T18:30-05:00[America/Bogota] |
| `Instant` | Un instante exacto en la línea temporal (UTC) | Para marcas de tiempo |
| `Duration` / `Period` | Una cantidad de tiempo en horas-minutos / días-meses-años | 90 minutos / 2 meses |

## Crear y operar

```java
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;

public class Main {
    public static void main(String[] args) {
        LocalDate hoy = LocalDate.of(2026, 10, 7);          // en un programa real: LocalDate.now()
        LocalDate entrega = hoy.plusDays(10);
        LocalDate haceUnMes = hoy.minusMonths(1);
        LocalDate fecha = LocalDate.parse("2026-12-25");    // formato ISO

        System.out.println(entrega + " " + haceUnMes + " " + fecha);
        System.out.println(fecha.getDayOfWeek());           // FRIDAY
        System.out.println(fecha.getMonth() == Month.DECEMBER);
        System.out.println(entrega.isAfter(hoy) + " " + fecha.isLeapYear());
        System.out.println(hoy.getDayOfWeek() == DayOfWeek.WEDNESDAY);
    }
}
```

> [!prueba]
> Cambia `hoy.plusDays(10)` por `hoy.plusDays(100)` y vuelve a ejecutar: Java se encarga solo de cambiar de mes y de año.

> [!cuidado]
> Como `String`, las fechas son **inmutables**: `plusDays` devuelve una fecha nueva y la original no cambia. Escribir solo `hoy.plusDays(1);` no hace nada; hay que guardar el resultado: `hoy = hoy.plusDays(1);`.

> [!idea]
> En los ejercicios se usan fechas fijas en vez de `LocalDate.now()`, para que el resultado sea el mismo cualquier día. En tu código, cuando la fecha actual importe, recíbela como parámetro o con un `Clock`: así podrás probarlo.

## Diferencias entre fechas

```java
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;

public class Main {
    public static void main(String[] args) {
        LocalDate nacimiento = LocalDate.of(1990, 5, 15);
        LocalDate hoy = LocalDate.of(2026, 10, 7);
        Period edad = Period.between(nacimiento, hoy);
        System.out.println(edad.getYears() + " años, " + edad.getMonths() + " meses y " + edad.getDays() + " días");
        System.out.println(ChronoUnit.DAYS.between(nacimiento, hoy) + " días vividos");

        LocalDateTime inicio = LocalDateTime.of(2026, 10, 7, 9, 15);
        LocalDateTime fin = LocalDateTime.of(2026, 10, 7, 11, 45);
        Duration duracion = Duration.between(inicio, fin);
        System.out.println(duracion.toMinutes() + " minutos");
    }
}
```

`ChronoUnit.DAYS.between(a, b)` es la forma más directa de contar días, por ejemplo para calcular un retraso.

> [!analogia]
> `Period` es como decir «faltan 2 meses y 3 días» (cuenta en calendario), y `Duration` como un cronómetro que marca «150 minutos» (cuenta tiempo exacto).

## Formatear y leer fechas

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        LocalDate fecha = LocalDate.of(2026, 10, 7);
        DateTimeFormatter corto = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter largo = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es"));
        System.out.println(fecha.format(corto));
        System.out.println(fecha.format(largo));
        LocalDate leida = LocalDate.parse("25/12/2026", corto);
        System.out.println(leida);
    }
}
```

| Patrón | Significa |
| --- | --- |
| `dd` / `d` | Día con o sin cero inicial |
| `MM` / `MMMM` | Mes en número / nombre |
| `yyyy` | Año |
| `HH:mm` | Hora y minutos (24 h) |
| `EEEE` | Nombre del día de la semana |

Un texto que no encaja con el patrón lanza `DateTimeParseException`.

> [!resumen]
> - `LocalDate`, `LocalTime` y `LocalDateTime` para fechas y horas; son inmutables.
> - `plusDays`, `minusMonths`, `isBefore`, `isAfter`, `getDayOfWeek`.
> - `Period` y `Duration` miden diferencias; `ChronoUnit.DAYS.between` cuenta días.
> - `DateTimeFormatter.ofPattern` formatea y lee fechas en el formato que necesites.
