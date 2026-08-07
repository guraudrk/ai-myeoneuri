import * as Speech from "expo-speech";

let _isSpeaking = false;

export async function speak(text: string): Promise<void> {
  await Speech.stop();
  _isSpeaking = true;
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: "ko-KR",
      rate: 0.85,
      pitch: 1.0,
      onDone: () => { _isSpeaking = false; resolve(); },
      onStopped: () => { _isSpeaking = false; resolve(); },
      onError: () => { _isSpeaking = false; resolve(); },
    });
  });
}

export function stop() {
  Speech.stop();
  _isSpeaking = false;
}

export function isSpeaking() { return _isSpeaking; }
