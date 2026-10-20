import React, { useEffect, useState, useCallback } from 'react';
import { Download, X, Smartphone, Monitor, Share2, Check } from 'lucide-react';

const STORAGE_KEY = 'funbet_install_dismissed_at';
const DISMISS_DAYS = 14;

const SHARE_TITLE = 'FunBet Casino';
const SHARE_TEXT = 'Rejoins-moi sur FunBet — Mines, Crash, Roue & Sweet Bonanza 🎰';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function getShareUrl(): string {
  if (typeof window === 'undefined') return 'https://casino-funbet.up.railway.app';
  return window.location.origin + '/';
}

/**
 * Boutons flottants mobile :
 * - Partager (toujours visible)
 * - Installer (si non installé)
 * + bandeau PWA optionnel
 */
export default function InstallAppPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installBtnHidden, setInstallBtnHidden] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'copied' | 'shared'>('idle');

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!wasDismissedRecently()) {
        setTimeout(() => setBannerOpen(true), 2500);
      }
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setBannerOpen(false);
      setDeferred(null);
    });

    if (isIos() && !wasDismissedRecently()) {
      setIosHint(true);
      setTimeout(() => setBannerOpen(true), 4000);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);

  const openFromButton = useCallback(() => {
    setIosHint(isIos() || !deferred);
    setBannerOpen(true);
  }, [deferred]);

  const handleShare = useCallback(async () => {
    const url = getShareUrl();
    const payload = { title: SHARE_TITLE, text: SHARE_TEXT, url };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(payload);
        setShareFeedback('shared');
        setTimeout(() => setShareFeedback('idle'), 2000);
        return;
      }
    } catch (err: unknown) {
      // User cancelled share sheet — do nothing
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        return;
      }
    }

    // Fallback : copie le lien
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setShareFeedback('copied');
      setTimeout(() => setShareFeedback('idle'), 2200);
    } catch {
      // Dernier recours : ouvrir WhatsApp web
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferred) {
      setIosHint(true);
      setBannerOpen(true);
      return;
    }
    setInstalling(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setBannerOpen(false);
        setInstalled(true);
      } else {
        dismissBanner();
      }
    } catch {
      dismissBanner();
    } finally {
      setInstalling(false);
      setDeferred(null);
    }
  }, [deferred, dismissBanner]);

  const fabBottom = 'calc(4.5rem + env(safe-area-inset-bottom, 0px))';

  return (
    <>
      {/* Boutons flottants mobile */}
      <div
        className="md:hidden fixed right-3 z-[85] flex flex-col items-end gap-2"
        style={{ bottom: fabBottom }}
      >
        {/* Partager — toujours visible */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="Partager FunBet"
          className="flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full bg-[#222629] text-white text-xs font-bold shadow-lg border border-[#2e3438] active:scale-95 transition-transform hover:border-[#9ce800]/40"
        >
          {shareFeedback === 'copied' || shareFeedback === 'shared' ? (
            <Check className="w-4 h-4 shrink-0 text-[#9ce800]" />
          ) : (
            <Share2 className="w-4 h-4 shrink-0 text-[#9ce800]" />
          )}
          <span>
            {shareFeedback === 'copied'
              ? 'Lien copié'
              : shareFeedback === 'shared'
                ? 'Partagé'
                : 'Partager'}
          </span>
        </button>

        {/* Installer — si non installé */}
        {!installed && !installBtnHidden && (
          <button
            type="button"
            onClick={openFromButton}
            aria-label="Installer l'application FunBet"
            className="flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full bg-[#9ce800] text-[#171a1c] text-xs font-black shadow-[0_4px_20px_rgba(156,232,0,0.35)] border border-[#9ce800]/40 active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Installer</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setInstallBtnHidden(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  setInstallBtnHidden(true);
                }
              }}
              className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10"
              aria-label="Masquer le bouton installer"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        )}
      </div>

      {/* Bandeau détail installation */}
      {bannerOpen && !installed && (
        <div
          role="dialog"
          aria-label="Installer FunBet"
          className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-[90] max-w-sm mx-auto sm:mx-0 pointer-events-none"
        >
          <div className="pointer-events-auto rounded-2xl border border-[#2e3438] bg-[#1a1d1f]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-3.5 flex gap-3 items-start animate-[slideUp_0.35s_ease-out]">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-[#9ce800]/15 border border-[#9ce800]/30 flex items-center justify-center">
              {iosHint ? (
                <Smartphone className="w-5 h-5 text-[#9ce800]" />
              ) : (
                <Monitor className="w-5 h-5 text-[#9ce800]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">
                Installer FunBet
              </p>
              {iosHint ? (
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  Sur mobile : appuyez sur{' '}
                  <span className="inline-flex items-center gap-0.5 text-zinc-200 font-medium">
                    <Share2 className="w-3 h-3" /> Partager
                  </span>{' '}
                  puis{' '}
                  <span className="text-zinc-200 font-medium">
                    Sur l&apos;écran d&apos;accueil
                  </span>
                  .
                </p>
              ) : (
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  Ajoutez FunBet à l&apos;écran d&apos;accueil pour un accès rapide, comme une app.
                </p>
              )}

              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {!iosHint && (
                  <button
                    type="button"
                    onClick={handleInstall}
                    disabled={installing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9ce800] text-[#171a1c] text-xs font-bold hover:brightness-110 active:scale-[0.98] transition disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {installing ? 'Installation…' : 'Installer'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222629] border border-[#2e3438] text-zinc-200 text-xs font-bold hover:border-[#9ce800]/40 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#9ce800]" />
                  Partager
                </button>
                <button
                  type="button"
                  onClick={dismissBanner}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition"
                >
                  Plus tard
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Fermer"
              className="shrink-0 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
