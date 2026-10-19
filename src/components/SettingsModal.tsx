import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Palette, 
  Code, 
  Trophy, 
  Smartphone, 
  Check, 
  Trash2, 
  Gauge, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { GameTheme, GAME_THEMES } from '../utils/themes';
import { GameDifficulty, DIFFICULTY_SETTINGS } from '../utils/difficulty';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: GameTheme;
  onThemeSelect: (theme: GameTheme) => void;
  currentDifficulty: GameDifficulty;
  onDifficultySelect: (diff: GameDifficulty) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  customAdCode: string;
  onSaveAdCode: (code: string) => void;
  highScore: number;
  highestCombo: number;
  totalBlocks: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeSelect,
  currentDifficulty,
  onDifficultySelect,
  soundEnabled,
  onToggleSound,
  customAdCode,
  onSaveAdCode,
  highScore,
  highestCombo,
  totalBlocks,
}) => {
  const [adInput, setAdInput] = useState(customAdCode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setAdInput(customAdCode);
  }, [customAdCode]);

  if (!isOpen) return null;

  const handleSaveAd = () => {
    onSaveAdCode(adInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearAd = () => {
    setAdInput('');
    onSaveAdCode('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Paramètres de Jeu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Difficulty Selection Section (Requested for ease of play) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span>Niveau de Difficulté</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Facilité de jeu
              </span>
            </div>

            <div className="space-y-2">
              {(Object.keys(DIFFICULTY_SETTINGS) as GameDifficulty[]).map((key) => {
                const config = DIFFICULTY_SETTINGS[key];
                const isSelected = key === currentDifficulty;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onDifficultySelect(key);
                      soundManager.playPlace(1);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900">{config.nameFr}</span>
                        {key === 'easy' && (
                          <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">
                            RECOMMANDÉ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound & Haptics */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-600" />
              <span>Effets Sonores & Vibrations</span>
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-600">
                Sons de synthèse & retours haptiques
              </span>
              <button
                type="button"
                onClick={onToggleSound}
                className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all ${
                  soundEnabled
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Activé</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Muet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Visual Theme Selection */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-600" />
              <span>Thème Graphique 3D</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {GAME_THEMES.map((theme) => {
                const isSelected = theme.id === currentTheme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      onThemeSelect(theme);
                      soundManager.playPlace(2);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-sm"
                      style={{ backgroundColor: theme.bgColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{theme.nameFr}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ad Code Section */}
          <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/80">
            <div className="flex items-center justify-between">
              <label htmlFor="ad-code" className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                <Code className="w-4 h-4 text-indigo-600" />
                <span>Code Publicitaire du Compte</span>
              </label>
              {adInput.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAd}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Effacer
                </button>
              )}
            </div>
            <p className="text-xs text-indigo-900/70">
              Votre script publicitaire officiel est configuré et diffuse exclusivement sur votre site.
            </p>
            <textarea
              id="ad-code"
              rows={3}
              value={adInput}
              onChange={(e) => setAdInput(e.target.value)}
              placeholder="<script async src='https://bicea.org/21/cf241cdc125c672f980988b33d9600b4'></script>"
              className="w-full text-xs font-mono p-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveAd}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Enregistré !</span>
                  </>
                ) : (
                  <span>Enregistrer le Code Pub</span>
                )}
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Vos Statistiques</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                <p className="text-slate-400 text-[10px] font-semibold">Record</p>
                <p className="text-base font-extrabold text-amber-600">{highScore}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                <p className="text-slate-400 text-[10px] font-semibold">Max Combo</p>
                <p className="text-base font-extrabold text-indigo-600">{highestCombo}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                <p className="text-slate-400 text-[10px] font-semibold">Blocs Posés</p>
                <p className="text-base font-extrabold text-emerald-600">{totalBlocks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Mode Facile activé par défaut • Magnétisme d&apos;alignement & boucliers de protection
        </div>
      </div>
    </div>
  );
};
