export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function speakSpanish(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
  },
): void {
  if (!isSpeechSupported()) {
    callbacks?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX';
  utterance.rate = 0.94;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((v) => v.lang.toLowerCase() === 'es-mx') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('es'));
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => {
    callbacks?.onStart?.();
  };
  utterance.onend = () => {
    callbacks?.onEnd?.();
  };
  utterance.onerror = () => {
    callbacks?.onEnd?.();
  };

  callbacks?.onStart?.();
  window.speechSynthesis.speak(utterance);
}
