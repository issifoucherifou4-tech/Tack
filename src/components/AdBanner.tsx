import React, { useEffect, useRef } from 'react';

export const USER_OFFICIAL_AD_SCRIPT = 'https://bicea.org/14/1006181676824a2e6298b6eb8f95412f';
export const USER_OFFICIAL_CONTAINER_ID = 'container-cf241cdc125c672f980988b33d9600b4';

export const DEFAULT_USER_AD_CODE = `<script data-cfasync="false" src="${USER_OFFICIAL_AD_SCRIPT}"></script>`;

interface AdBannerProps {
  customAdCode?: string;
  onOpenSettings?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  customAdCode,
}) => {
  const adSlotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = adSlotRef.current;
    if (!container) return;

    // Reset container and ensure strictly only the user's official ad container exists
    container.innerHTML = '';

    const adDiv = document.createElement('div');
    adDiv.id = USER_OFFICIAL_CONTAINER_ID;
    adDiv.className = 'w-full flex items-center justify-center min-h-[50px] overflow-hidden';
    container.appendChild(adDiv);

    // If custom code contains an alternate script or markup
    if (customAdCode && customAdCode !== DEFAULT_USER_AD_CODE) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(customAdCode, 'text/html');

        Array.from(doc.body.childNodes).forEach((node) => {
          if (node.nodeName.toLowerCase() === 'script') {
            const oldScript = node as HTMLScriptElement;
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            if (oldScript.src) newScript.src = oldScript.src;
            else newScript.textContent = oldScript.textContent;
            container.appendChild(newScript);
          } else if (node.nodeName.toLowerCase() !== 'div' || (node as HTMLElement).id !== USER_OFFICIAL_CONTAINER_ID) {
            container.appendChild(node.cloneNode(true));
          }
        });
        return;
      } catch {
        // Fallback to official script
      }
    }

    // Ensure official ad script is appended and active
    const script = document.createElement('script');
    script.src = USER_OFFICIAL_AD_SCRIPT;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    container.appendChild(script);
  }, [customAdCode]);

  return (
    <aside 
      aria-label="Publicité Officielle"
      className="w-full max-w-2xl mx-auto px-2 pb-1 pt-1 z-30 select-none"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="relative overflow-hidden rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-xs">
        {/* Subtle official ad indicator */}
        <div className="flex items-center justify-between px-3 py-0.5 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">
          <span>PUBLICITÉ</span>
          <span className="opacity-60 text-[8px] font-mono">bicea.org</span>
        </div>

        {/* Exclusive User Ad Container */}
        <div 
          ref={adSlotRef}
          className="p-1 min-h-[50px] w-full flex items-center justify-center text-center overflow-hidden"
        />
      </div>
    </aside>
  );
};
