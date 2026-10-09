La app funciona. Pero «funciona en mi navegador cuando la pruebo a mano» no es lo mismo que «funciona». En esta última etapa arreglas las pruebas que generó la CLI, escribes pruebas de verdad para el servicio y la lista, y generas la versión final con `ng build`.

> [!analogia]
> Antes de entregar las llaves de una casa, el inspector no se fía de que «la luz se encendió el otro día». Pulsa cada interruptor, abre cada grifo y lo apunta en una lista. Y lo puede repetir cada vez que alguien toque la instalación. Las pruebas automáticas son esa lista, ejecutada por una máquina en dos segundos.

## Paso 1: por qué fallan las pruebas generadas

Ejecuta las pruebas:

```bash
ng test --watch=false
```

Fallan cuatro, y la causa principal sale en rojo:

```text
NG0201: No provider found for `ActivatedRoute`. Source: DynamicTestModule.
```

Las pruebas usan `TestBed` (módulo 18), un entorno de Angular **vacío** para cada prueba: no lee tu `app.config.ts`. `App`, `NoEncontrada` y `DetalleTarea` usan `RouterLink`, y `RouterLink` necesita el router. Hay que dárselo a cada prueba con `provideRouter([])` (un router sin rutas, suficiente para que los enlaces funcionen). Además, la prueba de `App` busca el texto «Hello, mis-tareas», que borraste en la etapa 1.

```typescript
// src/app/app.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Mis tareas');
  });
});
```

En `no-encontrada.spec.ts` añade lo mismo: `import { provideRouter } from '@angular/router';` y `providers: [provideRouter([])],` debajo de `imports`. En `detalle-tarea.spec.ts` también, y una línea más, porque `id` es un input **obligatorio**:

```typescript
// src/app/tareas/detalle-tarea/detalle-tarea.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DetalleTarea } from './detalle-tarea';

describe('DetalleTarea', () => {
  let component: DetalleTarea;
  let fixture: ComponentFixture<DetalleTarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleTarea],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleTarea);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

`fixture.componentRef.setInput('id', '1')` hace en la prueba lo que el router hace en la app: darle valor al input.

## Paso 2: probar el servicio

El servicio pide `tareas.json` por HTTP. En una prueba no queremos peticiones reales: usamos un **backend de mentira** que controlamos.

```typescript
// src/app/tareas/tareas-store.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TareasStore } from './tareas-store';
import { Tarea } from './tarea';

const TAREAS: Tarea[] = [
  { id: 1, titulo: 'Comprar pan', prioridad: 'media', hecha: true },
  { id: 2, titulo: 'Estudiar signals', prioridad: 'alta', hecha: false },
];

describe('TareasStore', () => {
  let store: TareasStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TareasStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga las tareas del JSON', async () => {
    const carga = store.cargar();
    http.expectOne('tareas.json').flush(TAREAS);
    await carga;

    expect(store.tareas().length).toBe(2);
    expect(store.pendientes()).toBe(1);
    expect(store.hechas()).toBe(1);
  });

  it('solo pide el JSON una vez', async () => {
    const primera = store.cargar();
    const segunda = store.cargar();
    http.expectOne('tareas.json').flush(TAREAS);
    await Promise.all([primera, segunda]);

    expect(store.tareas().length).toBe(2);
  });

  it('agrega una tarea pendiente con un id nuevo', async () => {
    const carga = store.cargar();
    http.expectOne('tareas.json').flush(TAREAS);
    await carga;

    store.agregar('Llamar a Ana', 'baja');

    expect(store.porId(3)?.titulo).toBe('Llamar a Ana');
    expect(store.pendientes()).toBe(2);
  });

  it('alterna y borra tareas', () => {
    store.agregar('Leer', 'media');
    store.alternar(1);
    expect(store.hechas()).toBe(1);

    store.borrar(1);
    expect(store.tareas()).toEqual([]);
  });
});
```

- `provideHttpClientTesting()` (de `@angular/common/http/testing`) sustituye la red por un backend falso. Las peticiones quedan **en espera** hasta que la prueba las responde.
- `http.expectOne('tareas.json')` comprueba que se hizo **exactamente una** petición a esa URL; `.flush(TAREAS)` la responde con esos datos.
- `afterEach(() => http.verify())` falla si quedó alguna petición sin responder o alguna inesperada.
- La segunda prueba demuestra el `??=` de la etapa 2: dos llamadas a `cargar()`, una sola petición. Si quitaras el `??=`, `expectOne` fallaría al encontrar dos.
- La última no carga nada: el servicio empieza con una lista vacía, así que `Leer` recibe el id 1.

## Paso 3: probar la lista como la usa una persona

```typescript
// src/app/tareas/lista-tareas/lista-tareas.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ListaTareas } from './lista-tareas';

describe('ListaTareas', () => {
  let fixture: ComponentFixture<ListaTareas>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaTareas],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaTareas);
    http = TestBed.inject(HttpTestingController);
    http.expectOne('tareas.json').flush([
      { id: 1, titulo: 'Comprar pan', prioridad: 'media', hecha: true },
      { id: 2, titulo: 'Estudiar signals', prioridad: 'alta', hecha: false },
    ]);
    await fixture.whenStable();
  });

  it('muestra una fila por tarea', () => {
    const filas = fixture.nativeElement.querySelectorAll('li');
    expect(filas.length).toBe(2);
    expect(filas[0].textContent).toContain('Comprar pan');
  });

  it('filtra las pendientes al pulsar el botón', async () => {
    const botones: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    botones.find((b) => b.textContent?.trim() === 'Pendientes')?.click();
    await fixture.whenStable();

    const filas = fixture.nativeElement.querySelectorAll('li');
    expect(filas.length).toBe(1);
    expect(filas[0].textContent).toContain('Estudiar signals');
  });
});
```

Esta prueba no mira el código por dentro: busca botones y filas en el HTML, **pulsa** como lo haría una persona y comprueba lo que se ve. Si mañana cambias cómo se filtra internamente, la prueba sigue valiendo mientras la pantalla se comporte igual.

```bash
ng test --watch=false
```

```text
 Test Files  8 passed (8)
      Tests  13 passed (13)
```

Las pruebas generadas de `NuevaTarea`, `ResumenTareas` y del guard pasan sin cambios: no usan `RouterLink` ni hacen peticiones al crearse.

## Paso 4: la versión final

```bash
ng build
```

```text
Initial chunk files | Names          |  Raw size | Estimated transfer size
main-RYXNZGLB.js    | main           | 279.67 kB |                76.06 kB
styles-WIFZV723.css | styles         |  81 bytes |                81 bytes

                    | Initial total  | 279.75 kB |                76.14 kB

Lazy chunk files    | Names          |  Raw size | Estimated transfer size
chunk-BI4VTccl.js   | nueva-tarea    |  45.87 kB |                10.25 kB
chunk-Ypz7GRdJ.js   | detalle-tarea  |   1.41 kB |               718 bytes
chunk-BBeg0T6G.js   | resumen-tareas | 832 bytes |               832 bytes

Application bundle generation complete. [3.033 seconds]

Output location: dist/mis-tareas
```

Léelo como en el módulo 21: 76 kB viajan por la red al abrir la app, muy por debajo del presupuesto de 500 kB; el formulario, el detalle y el resumen van en sus propios archivos y solo se descargan cuando hacen falta. Tus nombres con *hash* serán distintos.

El proyecto completo queda así:

```arbol
mis-tareas/
  public/
    favicon.ico                    # El icono de la pestaña
    tareas.json                    # El backend falso: las tareas de ejemplo
  src/
    index.html                     # La única página, en español
    main.ts                        # Arranca App con appConfig (sin cambios)
    styles.css                     # Estilos globales
    app/
      app.ts                       # Raíz: cabecera con enlaces y router-outlet
      app.html                     # Plantilla de la raíz
      app.css                      # Estilos de la cabecera
      app.config.ts                # Router con input binding y HttpClient
      app.routes.ts                # Lista, nueva (diferida), detalle (diferida y con guard) y 404
      app.spec.ts                  # Prueba de la raíz, con provideRouter
      no-encontrada/               # La página 404 (ts, html, css, spec)
      tareas/
        tarea.ts                   # El modelo Tarea y el tipo Prioridad
        tareas-store.ts            # El estado con signals y la carga HTTP
        tareas-store.spec.ts       # Pruebas del servicio con HttpTestingController
        tarea-existe-guard.ts      # El guard que comprueba que la tarea existe
        tarea-existe-guard.spec.ts # Su prueba generada
        lista-tareas/              # La lista con filtros y el @defer del resumen
        nueva-tarea/               # El formulario reactivo
        detalle-tarea/             # El detalle con input binding
        resumen-tareas/            # El porcentaje completado
```

Para publicarla, sigue el módulo 21: sube el contenido de `dist/mis-tareas/browser/` a un hosting estático y configura el fallback a `index.html` (sin él, recargar en `/tareas/2` daría 404).

> [!cuidado]
> Si una prueba falla con un error del tipo «Expected one matching request for criteria "Match URL: tareas.json", found none», el componente no ha pedido el JSON cuando la prueba lo esperaba. Comprueba que `expectOne` va **después** de `TestBed.createComponent` (el constructor de la lista es quien llama a `cargar()`).

Checklist final:

- `ng test --watch=false` muestra 13 pruebas en verde.
- `ng build` termina sin avisos y con tres *lazy chunks*.
- Has recorrido la app entera: lista, filtros, crear, ver detalle, marcar, borrar y la 404.

> [!prueba]
> Sigue mejorándola tú: un filtro de texto que busque por título (un signal más y un `computed`), un botón «Borrar las hechas» en el servicio con su prueba, guardar las tareas en `localStorage` dentro de un `effect`, o un backend de verdad con `json-server` y los métodos `post`, `put` y `delete` de `HttpClient`. Cada mejora repasa un módulo del curso.

> [!resumen]
> - `TestBed` empieza vacío: cada prueba declara sus providers (`provideRouter([])`, `provideHttpClient()`, `provideHttpClientTesting()`).
> - `HttpTestingController` responde las peticiones con `expectOne(...).flush(...)` y `verify()` detecta las que sobran.
> - Las pruebas de componentes pulsan y leen el HTML como una persona; `setInput` da valor a inputs obligatorios.
> - `ng build` genera `dist/mis-tareas/browser/`, lista para publicar con fallback a `index.html`.
