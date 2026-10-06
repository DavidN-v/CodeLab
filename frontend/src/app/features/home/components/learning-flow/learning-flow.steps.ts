export interface LearningStep {
  label: string;
  description: string;
}

/** The loop every module follows, in order. */
export const LEARNING_STEPS: readonly LearningStep[] = [
  {
    label: 'Aprende',
    description: 'Cada concepto explica qué es, por qué existe y cuándo se usa, con ejemplos reales.',
  },
  {
    label: 'Practica',
    description: 'Modifica los ejemplos y resuelve ejercicios en un editor de verdad, no en un formulario.',
  },
  {
    label: 'Ejecuta',
    description: 'Tu código se compila y corre en un entorno aislado. Ves la salida y los errores tal cual.',
  },
  {
    label: 'Domina',
    description: 'Supera el desafío y la evaluación del módulo para desbloquear el siguiente.',
  },
];
