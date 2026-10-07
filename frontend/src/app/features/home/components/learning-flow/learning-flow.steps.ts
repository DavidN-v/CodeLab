export interface LearningStep {
  label: string;
  description: string;
}

/** The loop every module follows, in order. */
export const LEARNING_STEPS: readonly LearningStep[] = [
  {
    label: 'Aprende',
    description:
      'Lecciones cortas, con comparaciones de la vida diaria, diagramas y un quiz al final para comprobar que lo has entendido.',
  },
  {
    label: 'Practica',
    description:
      'Ejecuta y cambia los ejemplos dentro de la lección. Ordena líneas, completa huecos, adivina la salida o escribe el programa entero.',
  },
  {
    label: 'Ejecuta',
    description:
      'Mira tu programa ejecutarse paso a paso. Los errores aparecen explicados en español, y el tutor te da pistas sin darte la solución.',
  },
  {
    label: 'Domina',
    description:
      'Gana experiencia, cumple tu meta diaria, mantén la racha y repasa lo aprendido justo cuando empieza a olvidarse.',
  },
];
