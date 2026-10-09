Una lista de tareas en la que no se pueden crear tareas no sirve de mucho. En esta etapa añades la página **Nueva tarea**: un formulario reactivo con un título obligatorio de al menos 3 letras y una prioridad, que al guardarse añade la tarea al servicio y vuelve a la lista. Y la página se cargará de forma **diferida**: su código solo se descarga cuando alguien la visita.

> [!analogia]
> Un formulario reactivo es como el impreso de una ventanilla con un funcionario detrás que revisa cada casilla mientras la rellenas: «falta el título», «demasiado corto». No tienes que esperar a entregarlo para saber qué está mal, y el funcionario no deja pasar un impreso incompleto.

## Paso 1: generar el componente

```bash
ng generate component tareas/nueva-tarea
```

## Paso 2: la clase

```typescript
// src/app/tareas/nueva-tarea/nueva-tarea.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Prioridad } from '../tarea';
import { TareasStore } from '../tareas-store';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-nueva-tarea',
  styleUrl: './nueva-tarea.css',
  templateUrl: './nueva-tarea.html',
})
export class NuevaTarea {
  private readonly store = inject(TareasStore);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    prioridad: ['media' as Prioridad],
  });

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { titulo, prioridad } = this.form.getRawValue();
    this.store.agregar(titulo.trim(), prioridad);
    this.router.navigate(['/tareas']);
  }
}
```

- **Imports de `@angular/forms`**: `ReactiveFormsModule` trae las directivas de plantilla (`[formGroup]`, `formControlName`, `(ngSubmit)`); `FormBuilder` es un ayudante para crear formularios con poco código; `Validators` son las reglas de validación incluidas.
- **`nonNullable.group({...})`**: crea un `FormGroup` con dos controles. `nonNullable` hace que, al reiniciarse, cada control vuelva a su valor inicial en vez de a `null`, y que TypeScript sepa que el valor nunca es `null`.
- **`titulo: ['', [Validators.required, Validators.minLength(3)]]`**: empieza vacío, es obligatorio y necesita al menos 3 caracteres.
- **`prioridad: ['media' as Prioridad]`**: empieza en `'media'`. El `as Prioridad` le dice a TypeScript que este control guarda una `Prioridad`, no cualquier texto; así `getRawValue()` devuelve el tipo correcto para `agregar`.
- **`guardar()`**: si el formulario no es válido, `markAllAsTouched()` marca todos los campos como «tocados» para que aparezcan sus errores, y sale. Si es válido, lee los valores, añade la tarea (quitando espacios con `trim`) y navega a la lista con `Router.navigate`.

## Paso 3: la plantilla

```html
<!-- src/app/tareas/nueva-tarea/nueva-tarea.html -->
<h2>Nueva tarea</h2>

<form [formGroup]="form" (ngSubmit)="guardar()">
  <label>
    Título
    <input formControlName="titulo" />
  </label>

  @let titulo = form.controls.titulo;
  @if (titulo.touched && titulo.hasError('required')) {
    <p class="error">El título es obligatorio.</p>
  } @else if (titulo.touched && titulo.hasError('minlength')) {
    <p class="error">Escribe al menos 3 letras.</p>
  }

  <label>
    Prioridad
    <select formControlName="prioridad">
      <option value="alta">Alta</option>
      <option value="media">Media</option>
      <option value="baja">Baja</option>
    </select>
  </label>

  <button type="submit">Guardar</button>
</form>
```

- `[formGroup]="form"` conecta el `<form>` con el grupo de la clase; `formControlName` conecta cada campo con su control.
- `(ngSubmit)` se dispara al pulsar el botón `type="submit"` o Enter dentro del formulario, sin recargar la página.
- `@let titulo = form.controls.titulo;` da un nombre corto al control dentro de la plantilla (módulo 6).
- Los errores solo aparecen si el campo está **tocado** (`touched`: el usuario entró y salió de él, o intentó guardar). Así no regañas a nadie antes de que empiece a escribir. `hasError('minlength')` va en minúsculas: es el nombre del error que genera `Validators.minLength`.

```css
/* src/app/tareas/nueva-tarea/nueva-tarea.css */
form {
  display: grid;
  gap: 0.75rem;
  max-width: 20rem;
}

label {
  display: grid;
  gap: 0.25rem;
}

.error {
  margin: 0;
  color: #b91c1c;
}
```

## Paso 4: la ruta, con carga diferida

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ListaTareas } from './tareas/lista-tareas/lista-tareas';
import { NoEncontrada } from './no-encontrada/no-encontrada';

export const routes: Routes = [
  { path: '', redirectTo: 'tareas', pathMatch: 'full' },
  { path: 'tareas', component: ListaTareas, title: 'Mis tareas' },
  {
    path: 'tareas/nueva',
    loadComponent: () => import('./tareas/nueva-tarea/nueva-tarea').then((m) => m.NuevaTarea),
    title: 'Nueva tarea',
  },
  { path: '**', component: NoEncontrada, title: 'Página no encontrada' },
];
```

`loadComponent` con un `import()` dinámico hace que el componente y todo lo que usa (incluido `@angular/forms`, que no es pequeño) vayan en un archivo aparte. Fíjate en que **no** importamos `NuevaTarea` arriba del archivo para usarlo con `component:`, como hicimos con `ListaTareas`: si lo hiciéramos, entraría en el paquete principal y se perdería la carga diferida. Compruébalo con `ng build`:

```text
Initial chunk files | Names         |  Raw size | Estimated transfer size
chunk-GZFRO4UR.js   | -             | 261.13 kB |                71.44 kB
main-6HUBDJXK.js    | main          |   4.08 kB |                 1.49 kB
styles-WIFZV723.css | styles        |  81 bytes |                81 bytes

Lazy chunk files    | Names         |  Raw size | Estimated transfer size
chunk-JOHFCUCV.js   | nueva-tarea   |  45.81 kB |                10.20 kB
```

Los 45 kB del formulario solo se descargan al entrar en `/tareas/nueva`. (Los nombres con *hash* de tu build serán otros.)

## Lo que deberías ver

Pulsa «Nueva tarea» y, sin escribir nada, pulsa «Guardar»:

```pantalla
@url localhost:4200/tareas/nueva
<h2>Nueva tarea</h2>
<form style="display:grid;gap:.75rem;max-width:20rem">
  <label style="display:grid">Título <input></label>
  <p style="margin:0;color:#b91c1c">El título es obligatorio.</p>
  <label style="display:grid">Prioridad <select><option>Media</option></select></label>
  <button>Guardar</button>
</form>
```

Escribe «Ir al médico», elige «Alta» y guarda: vuelves a la lista, con la tarea nueva al final y el contador en «Pendientes: 3».

> [!cuidado]
> Si al abrir la página ves en la consola `Can't bind to 'formGroup' since it isn't a known property of 'form'`, te falta `ReactiveFormsModule` en el `imports` del componente. Y si el botón recarga la página entera, revisa que el formulario use `(ngSubmit)` (no `(submit)`) y que `ReactiveFormsModule` esté importado: es esa directiva la que impide la recarga.

Checklist de la etapa:

- «Nueva tarea» abre el formulario y su enlace aparece activo en la cabecera.
- Guardar vacío muestra «El título es obligatorio.»; con «ab», «Escribe al menos 3 letras.».
- Una tarea válida aparece en la lista como pendiente y los contadores se actualizan.
- `ng build` muestra un *lazy chunk* llamado `nueva-tarea`.

> [!prueba]
> Cambia el mínimo del título de 3 a 5 letras (`Validators.minLength(5)`) y actualiza el texto del mensaje de error. Escribe «Ir a» (4 letras) y comprueba que ahora falla; con «Ir al médico» pasa.

> [!resumen]
> - `FormBuilder.nonNullable.group` crea un formulario tipado con sus validadores.
> - `[formGroup]`, `formControlName` y `(ngSubmit)` conectan la plantilla; hacen falta en `imports` con `ReactiveFormsModule`.
> - Los errores se muestran con `touched` y `hasError(...)`; `markAllAsTouched()` los revela al intentar guardar.
> - `loadComponent` con `import()` saca la página a su propio *chunk*.
