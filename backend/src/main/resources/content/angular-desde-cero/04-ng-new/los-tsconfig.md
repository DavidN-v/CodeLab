En la lección anterior viste que `angular.json` dice **cómo se construye** el proyecto. Los archivos `tsconfig*.json` dicen otra cosa: **qué reglas aplica TypeScript** a tu código. Cuando el editor te marca una línea en rojo, esas reglas salen de aquí.

> [!analogia]
> Si `angular.json` es la receta, los `tsconfig` son las **normas de higiene** de la cocina: no deciden qué cocinas, pero rechazan cualquier plato que no las cumpla.

## Los tres archivos

`tsconfig.json` tiene las opciones comunes. Los otros dos lo **extienden** (`"extends": "./tsconfig.json"`) y solo dicen qué archivos compilan:

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  },
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.spec.json" }]
}
```

| Opción | Qué hace y por qué está |
| --- | --- |
| `noImplicitOverride` | Si redefines un método heredado, tienes que escribir `override`. Evita pisar un método sin querer. |
| `noPropertyAccessFromIndexSignature` | En objetos tipo diccionario obliga a escribir `config['clave']` en vez de `config.clave`, para que se note que la clave puede no existir. |
| `noImplicitReturns` | Si una función devuelve algo en un camino, debe devolver algo en todos. |
| `noFallthroughCasesInSwitch` | Prohíbe que un `case` de un `switch` caiga en el siguiente por olvidar `break`. |
| `skipLibCheck` | No revisa los tipos de las librerías de `node_modules` (ya vienen revisados): compila más rápido. |
| `isolatedModules` | Cada archivo debe poder traducirse solo. Lo exige esbuild, que compila archivos en paralelo. |
| `experimentalDecorators` | Activa los decoradores al estilo que usa Angular (`@Component`, `@Service`…). |
| `importHelpers` | Las funciones de ayuda de TypeScript se importan de `tslib` en vez de copiarse en cada archivo. |
| `target: "ES2022"` | A qué versión de JavaScript se traduce. ES2022 entiende clases, `async`/`await`… sin traducciones extra. |
| `module: "preserve"` | Deja los `import`/`export` tal cual: los resuelve el empaquetador, no TypeScript. |
| `strictInjectionParameters` | Error si Angular no sabe qué inyectar en un parámetro. |
| `strictInputAccessModifiers` | Respeta `private`, `protected` y `readonly` de los *inputs* también en las plantillas. |
| `enableI18nLegacyMessageIdFormat: false` | Usa el formato moderno de identificadores para las traducciones. |
| `files: []` + `references` | El archivo raíz no compila nada: solo reparte el trabajo entre la app y las pruebas. |

¿Y el modo estricto (`strict`)? No aparece porque **TypeScript 6 ya lo activa por defecto**, igual que Angular activa la comprobación estricta de plantillas. Si creas el proyecto con `--strict=false`, verás escrito `"strict": false` y `"strictTemplates": false`.

Los otros dos:

```json
// tsconfig.app.json: la aplicación
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": [] },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

```json
// tsconfig.spec.json: las pruebas
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": ["vitest/globals"] },
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
}
```

- La app compila todos los `.ts` de `src/` **menos** las pruebas, y `types: []` evita cargar tipos globales que no necesita.
- Las pruebas añaden `vitest/globals`: por eso en un `.spec.ts` puedes usar `describe`, `it` y `expect` sin importarlos.

> [!cuidado]
> El modo estricto te va a dar errores como `Parameter 'x' implicitly has an 'any' type` o `Type 'null' is not assignable to type 'number'`. No lo desactives para que desaparezcan: cada uno es un fallo que, sin él, aparecería en el navegador del usuario. Arregla el tipo.

> [!prueba]
> Abre `tsconfig.json` de tu proyecto y busca `noImplicitReturns`. Escribe una función que devuelva un número solo cuando una condición se cumple, sin `return` en el otro camino. El editor debe subrayarla; añade el `return` que falta y el error desaparece.

> [!resumen]
> - `tsconfig.json` tiene las reglas comunes; `tsconfig.app.json` compila la app y `tsconfig.spec.json` las pruebas.
> - Las opciones `no...` y `strict...` convierten fallos silenciosos en errores del editor.
> - Con TypeScript 6 el modo estricto ya viene activado aunque no lo veas escrito.
