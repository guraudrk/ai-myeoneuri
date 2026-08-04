import type { SpeechInputAdapter } from "./SpeechInputAdapter";

const DEMO_PHRASES = [
  "딸한테 전화해 줘",
  "아들한테 전화해 줘",
  "엄마한테 전화해 줘",
];

let phraseIndex = 0;

export function createMockSpeechAdapter(): SpeechInputAdapter {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    async isAvailable() {
      return true;
    },

    async startListening(onResult, _onError) {
      timer = setTimeout(() => {
        const phrase = DEMO_PHRASES[phraseIndex % DEMO_PHRASES.length];
        phraseIndex++;
        onResult(phrase);
      }, 1800);
    },

    async stopListening() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
