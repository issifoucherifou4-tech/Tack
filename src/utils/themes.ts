export interface GameTheme {
  id: string;
  name: string;
  nameFr: string;
  bgColor: string;
  baseBlockColor: number;
  textColor: string;
  uiBg: string;
  accentColor: string;
  getColor: (index: number, offset: number) => { r: number; g: number; b: number };
}

export const GAME_THEMES: GameTheme[] = [
  {
    id: 'pastel',
    name: 'Classic Pastel',
    nameFr: 'Pastel Classique',
    bgColor: '#D0CBC7',
    baseBlockColor: 0x333344,
    textColor: '#333344',
    uiBg: 'bg-[#D0CBC7]/80',
    accentColor: '#333344',
    getColor: (index: number, offset: number) => {
      const step = index + offset;
      const r = (Math.sin(0.3 * step) * 55 + 200) / 255;
      const g = (Math.sin(0.3 * step + 2) * 55 + 200) / 255;
      const b = (Math.sin(0.3 * step + 4) * 55 + 200) / 255;
      return { r, g, b };
    },
  },
  {
    id: 'neon',
    name: 'Cyberpunk Neon',
    nameFr: 'Néon Cyberpunk',
    bgColor: '#0f111a',
    baseBlockColor: 0x1f2438,
    textColor: '#f1f5f9',
    uiBg: 'bg-[#0f111a]/80',
    accentColor: '#06b6d4',
    getColor: (index: number, offset: number) => {
      const step = (index + offset) * 0.25;
      const r = (Math.sin(step) * 110 + 145) / 255;
      const g = (Math.sin(step + 2.1) * 110 + 145) / 255;
      const b = (Math.sin(step + 4.2) * 110 + 145) / 255;
      return { r, g, b };
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    nameFr: 'Coucher de Soleil',
    bgColor: '#2a1b2d',
    baseBlockColor: 0x3d2742,
    textColor: '#fed7aa',
    uiBg: 'bg-[#2a1b2d]/80',
    accentColor: '#f97316',
    getColor: (index: number, offset: number) => {
      const step = (index + offset) * 0.2;
      const r = (Math.sin(step) * 35 + 220) / 255;
      const g = (Math.sin(step + 1.2) * 60 + 140) / 255;
      const b = (Math.sin(step + 2.8) * 80 + 140) / 255;
      return { r, g, b };
    },
  },
  {
    id: 'emerald',
    name: 'Emerald Zen',
    nameFr: 'Émeraude Zen',
    bgColor: '#14221d',
    baseBlockColor: 0x1d362d,
    textColor: '#a7f3d0',
    uiBg: 'bg-[#14221d]/80',
    accentColor: '#10b981',
    getColor: (index: number, offset: number) => {
      const step = (index + offset) * 0.28;
      const r = (Math.sin(step) * 40 + 60) / 255;
      const g = (Math.sin(step + 1) * 60 + 190) / 255;
      const b = (Math.sin(step + 2.5) * 50 + 150) / 255;
      return { r, g, b };
    },
  },
];
