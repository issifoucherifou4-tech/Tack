import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, Settings2, X, Play, CheckCircle2 } from 'lucide-react';

interface AdBannerProps {
  customAdCode?: string;
  onOpenSettings?: () => void;
  onWatchRewardedAd?: () => void;
  canRevive?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  customAdCode,
  onOpenSettings,
  onWatchRewardedAd,
  canRevive = false,
}) => {
  const [adCode, setAdCode] = useState<string>(customAdCode || '');
  const [isRewardedModalOpen, setIsRewardedModalOpen] = useState(false);
  const [rewardedCountdown, setRewardedCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (customAdCode !== undefined) {
      setAdCode(customAdCode);
    } else {
      const saved = localStorage.getItem('stacker_ad_code');
      if (saved) setAdCode(saved);
    }
  }, [customAdCode]);

  const handleStartRewardedAd = () => {
    setIsRewardedModalOpen(true);
    setRewardedCountdown(3);

    const timer = setInterval(() => {
      setRewardedCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            setIsRewardedModalOpen(false);
            setRewardedCountdown(null);
            onWatchRewardedAd?.();
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <>
      {/* Responsive Bottom Ad Unit (Safe area aligned) */}
      <aside 
        aria-label="Espace Publicitaire"
        className="w-full max-w-2xl mx-auto px-2 pb-1 pt-1 z-30 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-md border border-black/10 shadow-sm transition-all hover:bg-white/90">
          {/* Ad Label & Config trigger */}
          <div className="flex items-center justify-between px-3 py-1 bg-black/5 border-b border-black/5 text-[10px] font-sans font-semibold tracking-wider uppercase text-gray-500">
            <span className="flex items-center gap-1">
              <span className="bg-amber-500/20 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">ANNONCE</span>
              <span>Espace Publicitaire Mobile</span>
            </span>

            <div className="flex items-center gap-2">
              {canRevive && (
                <button
                  type="button"
                  onClick={handleStartRewardedAd}
                  className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-transform"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Pub Récompense (+1 Vie)</span>
                </button>
              )}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Configurer votre code pub"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Ad Content */}
          {adCode && adCode.trim().length > 0 ? (
            <div 
              className="p-2 min-h-[50px] flex items-center justify-center text-xs overflow-hidden"
              dangerouslySetInnerHTML={{ __html: adCode }}
            />
          ) : (
            <div className="flex items-center justify-between px-3 py-2 gap-3 min-h-[50px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    Votre Marque Ici • Espace Sponsorisé
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Bannière mobile 100% responsive et monétisable
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-2.5 py-1 text-xs font-medium bg-black/10 hover:bg-black/15 text-gray-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Mon Code Pub</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Rewarded Ad Simulation Overlay */}
      {isRewardedModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-white text-center animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-xs w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold mb-1">Publicité Récompensée</h3>
            <p className="text-xs text-slate-300 mb-5">
              Merci de soutenir le créateur ! Votre tour va reprendre immédiatement.
            </p>

            <div className="relative w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-4">
              {rewardedCountdown !== null && rewardedCountdown > 0 ? (
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {rewardedCountdown}
                </span>
              ) : (
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-scale-in" />
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              {rewardedCountdown === 0 ? 'Récompense débloquée !' : 'Visionnage en cours...'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
