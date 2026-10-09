Tu app funciona en `ng serve`. Pero `ng serve` es un servidor **de desarrollo**: compila en memoria, recarga al guardar y no está pensado para recibir a miles de visitantes. Para publicar la app necesitas archivos: HTML, JavaScript y CSS que cualquier servidor web pueda enviar. Eso es lo que produce `ng build`. En el módulo 4 viste lo básico; ahora vamos a entender cada decisión que toma.

> [!analogia]
> `ng serve` es cocinar en casa: pruebas, corriges, la cocina está desordenada y no importa. `ng build` es preparar los táperes para un catering: todo en raciones, bien cerrado, etiquetado con la fecha y sin nada que sobre. La receta es la misma; el envase, otro.

## Dos configuraciones

`ng build` lee la sección `build` de `angular.json`. Tiene opciones comunes (`options`) y dos **configuraciones** que se aplican encima:

```json
"configurations": {
  "production": {
    "budgets": [
      { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
      { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
    ],
    "outputHashing": "all"
  },
  "development": {
    "optimization": false,
    "extractLicenses": false,
    "sourceMap": true
  }
},
"defaultConfiguration": "production"
```

`defaultConfiguration: "production"` significa que `ng build` sin más es una compilación de producción. Para la otra: `ng build --configuration development` (o `-c development`). `ng serve`, en cambio, usa `development` por defecto.

Compara las dos salidas del mismo proyecto recién creado:

```bash
ng build
```

```text
Initial chunk files | Names         |  Raw size | Estimated transfer size
main-O7QUVEYP.js    | main          | 216.46 kB |                59.41 kB
styles-5INURTSO.css | styles        |   0 bytes |                 0 bytes

                    | Initial total | 216.46 kB |                59.41 kB

Application bundle generation complete. [2.095 seconds]

Output location: dist/mi-app
```

```bash
ng build -c development
```

```text
Initial chunk files | Names         | Raw size
main.js             | main          |  1.39 MB
styles.css          | styles        | 95 bytes

                    | Initial total |  1.39 MB

Application bundle generation complete. [3.056 seconds]
```

¡De 216 kB a 1,39 MB! La diferencia la explican las opciones.

## Cada opción, qué hace y por qué

- **`optimization`** (activa por defecto, desactivada en `development`): **minifica** (quita espacios y comentarios, acorta nombres de variables), hace *tree-shaking* (elimina el código que nadie usa, como sacudir un árbol para que caigan las hojas secas) e incrusta el CSS crítico en el HTML. Por eso el `main.js` de producción ocupa una sexta parte.
- **`outputHashing: "all"`**: añade al nombre de cada archivo un *hash*, una huella calculada a partir de su contenido: `main-O7QUVEYP.js`. Si el contenido cambia, el nombre cambia. Así el servidor puede decir al navegador «guarda estos archivos un año» sin miedo: la siguiente versión tendrá nombres nuevos y el navegador los descargará. Solo `index.html` no lleva hash, porque es el que apunta a todo lo demás.
- **`sourceMap`** (solo en `development`): genera archivos `.map` que relacionan el código compilado con tu TypeScript original. Con ellos, el depurador del navegador te muestra `app.ts` línea a línea en vez de un código ilegible. En producción no se generan por defecto para no publicar tu código fuente legible; si los necesitas para un servicio de errores, puedes activarlos y no subirlos al servidor público.
- **`extractLicenses`**: reúne las licencias de las librerías que usas en `3rdpartylicenses.txt`. Desactivado en desarrollo porque no hace falta y ahorra tiempo.
- **`budgets`** (presupuestos): límites de tamaño. Lo vemos ahora.

> [!idea]
> «Estimated transfer size» (59 kB) es lo que viaja por la red: los servidores comprimen los archivos (gzip o brotli) antes de enviarlos. «Raw size» (216 kB) es lo que ocupa en disco y lo que el navegador tiene que leer y ejecutar.

## Budgets: una alarma de peso

Cada `ng build` comprueba los presupuestos:

- `initial`: todo lo que se descarga al abrir la app. Aviso a partir de 500 kB, error a partir de 1 MB.
- `anyComponentStyle`: el CSS de cada componente. Aviso a partir de 4 kB, error a partir de 8 kB.

Si te pasas del aviso, el build termina con un `WARNING`. Si te pasas del error, **falla**:

```text
Application bundle generation failed.

▲ [WARNING] bundle initial exceeded maximum budget. Budget 100.00 kB was not met by 116.46 kB with a total of 216.46 kB.

✘ [ERROR] bundle initial exceeded maximum budget. Budget 200.00 kB was not met by 16.46 kB with a total of 216.46 kB.
```

(Este ejemplo bajó los límites a 100 kB y 200 kB a propósito para provocar el error.) Que el build falle es una ventaja: si alguien añade una librería de 800 kB sin darse cuenta, la integración continua lo detiene antes de que llegue a tus usuarios.

## Qué hay en dist/

```arbol
dist/mi-app/
  3rdpartylicenses.txt       # Las licencias de las librerías incluidas
  browser/                   # ESTO es lo que se publica en el servidor web
    index.html               # La única página; apunta a los archivos con hash
    main-O7QUVEYP.js         # Tu app y Angular, minificados
    styles-5INURTSO.css      # Los estilos globales
    favicon.ico              # Copiado desde public/
```

Todo lo que pongas en `public/` se copia tal cual a `browser/`. Lo que publicas es el **contenido** de `browser/`.

> [!cuidado]
> No publiques nunca la salida de `ng build -c development` ni de `ng serve`: es seis veces más grande, más lenta y expone tu código con *source maps*. Y no edites a mano los archivos de `dist/`: se borran y se regeneran en cada build (la opción `deleteOutputPath` está activa por defecto).

> [!prueba]
> En tu proyecto, ejecuta `ng build` y después `ng build -c development`. Compara los tamaños y los nombres de los archivos en `dist/`. Después cambia una línea de `app.html`, vuelve a ejecutar `ng build` y observa que el hash de `main-….js` ha cambiado.

> [!resumen]
> - `ng build` usa la configuración `production` por defecto; `-c development` cambia a la de desarrollo.
> - Producción optimiza (minifica y elimina código muerto) y añade hashes a los nombres para poder cachear sin miedo.
> - Los *source maps* conectan el código compilado con tu TypeScript; solo se generan en desarrollo por defecto.
> - Los *budgets* avisan o hacen fallar el build si la app crece demasiado. Se publica `dist/<app>/browser/`.
