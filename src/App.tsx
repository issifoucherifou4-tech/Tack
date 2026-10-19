import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Settings2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Play, 
  Share2, 
  Check, 
  Flame,
  Zap,
  Shield,
  Gauge,
  MousePointerClick
} from 'lucide-react';
import { StackerGame, StackerGameHandle, GameStatus } from './components/StackerGame';
import { AdBanner } from './components/AdBanner';
import { SettingsModal } from './components/SettingsModal';
import { GAME_THEMES, GameTheme } from './utils/themes';
import { GameDifficulty, DIFFICULTY_SETTINGS } from './utils/difficulty';
import { soundManager } from './utils/audio';

export default function App() {
  const gameRef = useRef<StackerGameHandle>(null);

  // Difficulty & Accessibility (default to 'easy' as requested)
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [lives, setLives] = useState<number>(DIFFICULTY_SETTINGS.easy.initialLives);
  const [isAligned, setIsAligned] = useState<boolean>(false);
  const [assistToast, setAssistToast] = useState<string | null>(null);

  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>('ready');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [highestCombo, setHighestCombo] = useState<number>(0);
  const [totalBlocks, setTotalBlocks] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [hasUsedRevive, setHasUsedRevive] = useState<boolean>(false);

  // Preferences & customization
  const [theme, setTheme] = useState<GameTheme>(GAME_THEMES[0]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [customAdCode, setCustomAdCode] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedDifficulty = localStorage.getItem('stacker_difficulty') as GameDifficulty;
      if (savedDifficulty && DIFFICULTY_SETTINGS[savedDifficulty]) {
        setDifficulty(savedDifficulty);
        setLives(DIFFICULTY_SETTINGS[savedDifficulty].initialLives);
      }

      const savedScore = localStorage.getItem('stacker_highscore');
      if (savedScore) setHighScore(parseInt(savedScore, 10));

      const savedMaxCombo = localStorage.getItem('stacker_highest_combo');
      if (savedMaxCombo) setHighestCombo(parseInt(savedMaxCombo, 10));

      const savedTotal = localStorage.getItem('stacker_total_blocks');
      if (savedTotal) setTotalBlocks(parseInt(savedTotal, 10));

      const savedThemeId = localStorage.getItem('stacker_theme');
      if (savedThemeId) {
        const found = GAME_THEMES.find(t => t.id === savedThemeId);
        if (found) setTheme(found);
      }

      const savedSound = localStorage.getItem('stacker_sound');
      if (savedSound !== null) {
        const enabled = savedSound === 'true';
        setSoundEnabled(enabled);
        soundManager.enabled = enabled;
      }

      const savedAdCode = localStorage.getItem('stacker_ad_code');
      if (savedAdCode) setCustomAdCode(savedAdCode);
    } catch {
      // Local storage might be blocked in some iframe contexts
    }
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
        if (!isSettingsOpen) {
          e.preventDefault();
          gameRef.current?.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  // Handle score increments
  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > 0) {
      setTotalBlocks(prev => {
        const updated = prev + 1;
        try {
          localStorage.setItem('stacker_total_blocks', updated.toString());
        } catch {}
        return updated;
      });
    }

    if (newScore > highScore) {
      setHighScore(newScore);
      setIsNewRecord(true);
      try {
        localStorage.setItem('stacker_highscore', newScore.toString());
      } catch {}
    }
  }, [highScore]);

  // Handle combo increments
  const handleComboChange = useCallback((newCombo: number) => {
    setCombo(newCombo);
    if (newCombo > highestCombo) {
      setHighestCombo(newCombo);
      try {
        localStorage.setItem('stacker_highest_combo', newCombo.toString());
      } catch {}
    }
  }, [highestCombo]);

  // Status updates
  const handleStatusChange = useCallback((status: GameStatus) => {
    setGameStatus(status);
    if (status === 'playing') {
      setIsNewRecord(false);
      setHasUsedRevive(false);
    }
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    try {
      localStorage.setItem('stacker_sound', next.toString());
    } catch {}
  };

  const handleSelectTheme = (newTheme: GameTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('stacker_theme', newTheme.id);
    } catch {}
  };

  const handleSelectDifficulty = (newDiff: GameDifficulty) => {
    setDifficulty(newDiff);
    setLives(DIFFICULTY_SETTINGS[newDiff].initialLives);
    try {
      localStorage.setItem('stacker_difficulty', newDiff);
    } catch {}
  };

  // Cycle difficulty directly from HUD
  const handleCycleDifficulty = () => {
    const sequence: GameDifficulty[] = ['easy', 'normal', 'hard'];
    const nextIdx = (sequence.indexOf(difficulty) + 1) % sequence.length;
    handleSelectDifficulty(sequence[nextIdx]);
    soundManager.playPlace(1);
  };

  const handleSaveAdCode = (code: string) => {
    setCustomAdCode(code);
    try {
      localStorage.setItem('stacker_ad_code', code);
    } catch {}
  };

  const handleReviveGame = () => {
    setHasUsedRevive(true);
    gameRef.current?.revive();
  };

  // Toast feedback helpers
  const showToast = (message: string) => {
    setAssistToast(message);
    setTimeout(() => {
      setAssistToast(null);
    }, 2000);
  };

  const handleShieldSaved = () => {
    showToast('🛡️ Oups ! Le bouclier vous a sauvé ! Réessayez !');
  };

  const handleBlockGrew = () => {
    showToast('🌱 Parfait ! Votre bloc s\'est agrandi !');
  };

  // Share score
  const handleShare = async () => {
    const text = `🏆 J'ai fait un score de ${score} sur Stacker 3D (${DIFFICULTY_SETTINGS[difficulty].nameFr}) ! Peux-tu me battre ?`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Stacker 3D',
          text,
          url: window.location.href,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {}
    }
  };

  const currentDiffConfig = DIFFICULTY_SETTINGS[difficulty];

  return (
    <main 
      className="relative w-screen h-screen overflow-hidden select-none touch-none flex flex-col justify-between"
      style={{ 
        backgroundColor: theme.bgColor, 
        color: theme.textColor,
        fontFamily: "'Comfortaa', cursive, sans-serif"
      }}
    >
      {/* 3D Three.js Interactive Canvas */}
      <StackerGame
        ref={gameRef}
        theme={theme}
        difficulty={difficulty}
        gameStatus={gameStatus}
        score={score}
        combo={combo}
        lives={lives}
        onScoreChange={handleScoreChange}
        onComboChange={handleComboChange}
        onLivesChange={setLives}
        onStatusChange={handleStatusChange}
        onAlignmentChange={setIsAligned}
        onShieldSaved={handleShieldSaved}
        onBlockGrew={handleBlockGrew}
      />

      {/* Top HUD Controls (Safe area aligned) */}
      <header className="relative z-20 flex items-center justify-between p-3.5 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
        {/* Record & Mode Badges */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-md border border-black/5 shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span className="text-xs font-bold tracking-wider">RECORD : {highScore}</span>
          </div>

          {/* Quick Difficulty Alternator Button */}
          <button
            type="button"
            onClick={handleCycleDifficulty}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold backdrop-blur-md border shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 ${
              difficulty === 'easy'
                ? 'bg-emerald-500/25 text-emerald-950 border-emerald-500/40 ring-1 ring-emerald-500/20'
                : difficulty === 'normal'
                ? 'bg-amber-500/25 text-amber-950 border-amber-500/40 ring-1 ring-amber-500/20'
                : 'bg-rose-500/25 text-rose-950 border-rose-500/40 ring-1 ring-rose-500/20'
            }`}
            title="Cliquez pour alterner le mode de jeu"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{currentDiffConfig.badge}</span>
            <span className="text-[10px] opacity-70 underline ml-0.5 font-bold">Alterner ⇄</span>
          </button>
        </div>

        {/* Action Buttons & Lives display */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Shields remaining in Easy/Normal mode */}
          {gameStatus === 'playing' && lives > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 text-xs font-bold">
              <Shield className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{lives}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
            className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/15 active:scale-95 backdrop-blur-md border border-black/5 flex items-center justify-center transition-transform"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-red-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Ouvrir les paramètres"
            className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/15 active:scale-95 backdrop-blur-md border border-black/5 flex items-center justify-center transition-transform"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Accessibility Toast Notifications */}
      {assistToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 animate-bounce pointer-events-none">
          <span>{assistToast}</span>
        </div>
      )}

      {/* Center Dynamic HUD: Score & Timing Assist */}
      <section className="relative z-20 flex flex-col items-center justify-center pointer-events-none -mt-4">
        {/* Real-time Alignment indicator (Visually aids timing for easier play) */}
        {gameStatus === 'playing' && currentDiffConfig.assistGuideline && (
          <div className={`transition-all duration-150 mb-1 px-3 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider ${
            isAligned
              ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/50 animate-pulse'
              : 'opacity-0 scale-90'
          }`}>
            ✨ PARFAIT ! APPUYEZ !
          </div>
        )}

        {/* Combo streak banner */}
        {combo >= 2 && gameStatus === 'playing' && (
          <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-400 text-slate-900 font-extrabold text-xs uppercase tracking-wider shadow-lg animate-bounce">
            <Flame className="w-4 h-4 fill-current text-orange-600" />
            <span>COMBO x{combo} ! PARFAIT !</span>
          </div>
        )}

        {/* Huge Animated Score */}
        <div 
          className={`font-['Outfit',sans-serif] font-black tracking-tighter transition-all duration-300 drop-shadow-sm ${
            gameStatus === 'playing' || gameStatus === 'resetting'
              ? 'text-7xl sm:text-8xl scale-100 opacity-90'
              : gameStatus === 'ended'
              ? 'text-8xl sm:text-9xl scale-110 opacity-100'
              : 'text-6xl opacity-75'
          }`}
        >
          {score}
        </div>

        {/* Guidance Prompt for Mobile/Desktop */}
        {gameStatus === 'playing' && score < 3 && (
          <p className="text-xs sm:text-sm font-semibold opacity-75 mt-1 bg-black/5 px-4 py-1 rounded-full animate-pulse">
            Appuyez n&apos;importe où pour poser le bloc
          </p>
        )}
      </section>

      {/* State Overlay: Ready State */}
      {gameStatus === 'ready' && (
        <div className="relative z-20 flex flex-col items-center mb-6 pointer-events-none animate-in fade-in zoom-in-95 duration-300 px-4 w-full max-w-sm self-center">
          {/* Segmented Mode Alternator */}
          <div className="pointer-events-auto w-full mb-2.5 bg-black/10 backdrop-blur-md p-1 rounded-2xl border border-black/10 flex items-center gap-1 shadow-sm">
            {(['easy', 'normal', 'hard'] as GameDifficulty[]).map((mode) => {
              const isSelected = difficulty === mode;
              const cfg = DIFFICULTY_SETTINGS[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    handleSelectDifficulty(mode);
                    soundManager.playPlace(1);
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 active:scale-95 ${
                    isSelected
                      ? mode === 'easy'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : mode === 'normal'
                        ? 'bg-amber-500 text-slate-900 shadow-md'
                        : 'bg-rose-500 text-white shadow-md'
                      : 'text-current opacity-70 hover:opacity-100 hover:bg-black/5'
                  }`}
                >
                  <span className="flex items-center gap-1 font-extrabold text-[11px]">
                    <span>{mode === 'easy' ? '🟢' : mode === 'normal' ? '🟡' : '🔴'}</span>
                    <span>{cfg.nameFr.split(' ')[0]}</span>
                  </span>
                  <span className="text-[9px] opacity-80 font-medium">
                    {mode === 'easy' ? 'Détente' : mode === 'normal' ? 'Équilibré' : 'Rapide'}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] opacity-80 mb-3 text-center max-w-xs px-2 font-medium">
            {difficulty === 'easy' && '✨ Mode Facile : vitesse douce, tolérance large, 2 boucliers de sauvetage.'}
            {difficulty === 'normal' && '⚡ Mode Normal : vitesse classique équilibrée, 1 bouclier de sauvetage.'}
            {difficulty === 'hard' && '🔥 Mode Expert : vitesse rapide, découpe stricte, aucun bouclier.'}
          </p>

          <button
            type="button"
            onClick={() => gameRef.current?.action()}
            className="pointer-events-auto w-full max-w-xs py-3.5 rounded-2xl bg-black/15 hover:bg-black/20 active:scale-95 backdrop-blur-md border-2 border-current font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-md"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>COMMENCER LA PARTIE</span>
          </button>
          
          <p className="text-[11px] opacity-75 mt-2.5 text-center">
            Touchez l&apos;écran ou appuyez sur Espace pour jouer
          </p>
        </div>
      )}

      {/* State Overlay: Game Over Card */}
      {gameStatus === 'ended' && (
        <section 
          aria-label="Fin de partie"
          className="relative z-20 mx-4 max-w-sm self-center bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl border border-black/10 rounded-3xl p-5 shadow-2xl text-center pointer-events-auto animate-in slide-in-from-bottom-8 duration-300 mb-2"
        >
          {isNewRecord && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-[11px] mb-2 shadow-md animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NOUVEAU RECORD PERSONNEL !</span>
            </div>
          )}

          <h2 className="text-2xl font-extrabold tracking-tight">Partie Terminée</h2>
          <p className="text-xs opacity-70 mt-0.5 mb-3">
            {difficulty === 'easy' ? 'Bien joué ! Continuez pour battre votre record.' : 'Bel effort ! Vous pouvez alterner vers le mode Facile pour plus de confort.'}
          </p>

          {/* Alternance de mode rapide dans Game Over */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 text-xs mb-3">
            <span className="font-bold text-[11px] opacity-75">Alterner mode :</span>
            <div className="flex items-center gap-1">
              {(['easy', 'normal', 'hard'] as GameDifficulty[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    handleSelectDifficulty(mode);
                    soundManager.playPlace(1);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    difficulty === mode
                      ? mode === 'easy'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : mode === 'normal'
                        ? 'bg-amber-500 text-slate-900 shadow-xs'
                        : 'bg-rose-500 text-white shadow-xs'
                      : 'opacity-50 hover:opacity-100 hover:bg-black/10'
                  }`}
                >
                  {mode === 'easy' ? '🟢 Facile' : mode === 'normal' ? '🟡 Normal' : '🔴 Expert'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded-2xl border border-black/5">
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Score Final</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{score}</p>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded-2xl border border-black/5">
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Meilleur Score</p>
              <p className="text-2xl font-black text-amber-500">{highScore}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {!hasUsedRevive && score >= 2 && (
              <button
                type="button"
                onClick={handleReviveGame}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Continuer la tour (+1 Chance Pub)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => gameRef.current?.restart()}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejouer Immédiatement</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="w-full py-2 px-4 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 active:scale-98 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Score copié dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Partager mon score</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Ergonomic Mobile Action Touch Bar (when playing) */}
      {gameStatus === 'playing' && (
        <div className="relative z-20 px-4 mb-2 max-w-sm mx-auto w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              gameRef.current?.action();
            }}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 border active:scale-95 ${
              isAligned
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                : 'bg-black/10 text-current hover:bg-black/15 border-black/10 backdrop-blur-md'
            }`}
          >
            <MousePointerClick className="w-4 h-4" />
            <span>{isAligned ? 'PARFAIT ! TAP ICI' : 'TOUCHER POUR POSER LE BLOC'}</span>
          </button>
        </div>
      )}

      {/* Responsive Mobile / Web Advertisement Banner */}
      <footer className="relative z-20 w-full pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <AdBanner
          customAdCode={customAdCode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onWatchRewardedAd={handleReviveGame}
          canRevive={gameStatus === 'ended' && !hasUsedRevive && score >= 2}
        />
      </footer>

      {/* Settings & Custom Ad Code Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onThemeSelect={handleSelectTheme}
        currentDifficulty={difficulty}
        onDifficultySelect={handleSelectDifficulty}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        customAdCode={customAdCode}
        onSaveAdCode={handleSaveAdCode}
        highScore={highScore}
        highestCombo={highestCombo}
        totalBlocks={totalBlocks}
      />
    </main>
  );
}
