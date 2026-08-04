import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import type { SpeechInputAdapter } from "./SpeechInputAdapter";

export { useSpeechRecognitionEvent };

export function createExpoSpeechAdapter(): SpeechInputAdapter {
  let _onResult: ((text: string) => void) | null = null;
  let _onError: ((msg: string) => void) | null = null;

  ExpoSpeechRecognitionModule.addListener("result", (event) => {
    if (!_onResult) return;
    const text = event.results?.[0]?.transcript;
    if (text && event.isFinal) {
      _onResult(text);
    }
  });

  ExpoSpeechRecognitionModule.addListener("error", (event) => {
    if (!_onError) return;
    const msg = event.message ?? event.error ?? "음성 인식 오류";
    _onError(String(msg));
  });

  return {
    async isAvailable() {
      try {
        const { granted } = await ExpoSpeechRecognitionModule.getPermissionsAsync();
        return granted;
      } catch {
        return false;
      }
    },

    async startListening(onResult, onError) {
      try {
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) {
          onError("마이크 권한이 없어요");
          return;
        }
        _onResult = onResult;
        _onError = onError;
        ExpoSpeechRecognitionModule.start({
          lang: "ko-KR",
          interimResults: false,
          maxAlternatives: 1,
          continuous: false,
        });
      } catch (e: unknown) {
        onError(e instanceof Error ? e.message : "음성 인식을 시작할 수 없어요");
      }
    },

    async stopListening() {
      try {
        _onResult = null;
        _onError = null;
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    },
  };
}
