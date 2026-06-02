import { useCallback } from 'react';
import { useSpeechContext } from '../context/SpeechContext';

interface SpeechOptions {
  lang?: string;
  rate?: number;
  interrupt?: boolean;
}

export function useSpeech() {
  const { speak: contextSpeak, muted } = useSpeechContext();

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    contextSpeak(text, options);
  }, [contextSpeak]);

  return { speak, muted };
}
