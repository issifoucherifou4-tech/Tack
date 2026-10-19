export type GameDifficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  id: GameDifficulty;
  name: string;
  nameFr: string;
  description: string;
  badge: string;
  speedBase: number;
  speedMax: number;
  speedIncrement: number;
  perfectTolerance: number;
  minBlockSize: number;
  sizeRegrowth: boolean;
  initialLives: number;
  assistGuideline: boolean;
}

export const DIFFICULTY_SETTINGS: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    name: 'Easy / Relax',
    nameFr: 'Facile / Détente',
    description: 'Vitesse douce, tolérance élargie, 2 boucliers de sauvetage et blocs qui ne deviennent jamais trop petits.',
    badge: '🟢 Facile (Recommandé)',
    speedBase: 0.08,
    speedMax: 0.15,
    speedIncrement: 0.001,
    perfectTolerance: 0.85,
    minBlockSize: 4.5,
    sizeRegrowth: true,
    initialLives: 2,
    assistGuideline: true,
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    nameFr: 'Normal',
    description: 'Vitesse progressive standard, 1 bouclier de sauvetage et régénération sur combo.',
    badge: '🟡 Normal',
    speedBase: 0.11,
    speedMax: 0.24,
    speedIncrement: 0.0025,
    perfectTolerance: 0.45,
    minBlockSize: 2.5,
    sizeRegrowth: true,
    initialLives: 1,
    assistGuideline: true,
  },
  hard: {
    id: 'hard',
    name: 'Expert',
    nameFr: 'Expert / Difficile',
    description: 'Vitesse rapide, découpe chirurgicale et aucun droit à l\'erreur.',
    badge: '🔴 Expert',
    speedBase: 0.15,
    speedMax: 0.38,
    speedIncrement: 0.005,
    perfectTolerance: 0.26,
    minBlockSize: 1.2,
    sizeRegrowth: false,
    initialLives: 0,
    assistGuideline: false,
  },
};
