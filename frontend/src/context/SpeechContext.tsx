import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SpeechOptions {
  lang?: string;
  rate?: number;
  interrupt?: boolean;
}

interface SpeechContextType {
  muted: boolean;
  toggleMute: () => void;
  setMuted: (value: boolean) => void;
  speak: (text: string, options?: SpeechOptions) => void;
}

function getStorageKey(role: string): string {
  return `touchglyph_muted_${role}`;
}

function getDefaultMuted(role: string): boolean {
  return role !== 'student';
}

function loadMuted(role: string): boolean {
  try {
    const stored = localStorage.getItem(getStorageKey(role));
    if (stored !== null) return stored === 'true';
  } catch {}
  return getDefaultMuted(role);
}

const SpeechContext = createContext<SpeechContextType | null>(null);

export function SpeechProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.role || 'guest';
  const [muted, setMutedState] = useState(() => loadMuted(role));

  useEffect(() => {
    setMutedState(loadMuted(role));
  }, [role]);

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
    try { localStorage.setItem(getStorageKey(role), String(value)); } catch {}
  }, [role]);

  const toggleMute = useCallback(() => {
    setMutedState(prev => {
      const next = !prev;
      try { localStorage.setItem(getStorageKey(role), String(next)); } catch {}
      return next;
    });
  }, [role]);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!('speechSynthesis' in window)) return;
    if (muted) return;

    const { lang = 'es-ES', rate = 0.9, interrupt = true } = options;

    if (interrupt) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  return (
    <SpeechContext.Provider value={{ muted, toggleMute, setMuted, speak }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeechContext(): SpeechContextType {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error('useSpeechContext debe usarse dentro de SpeechProvider');
  return ctx;
}
