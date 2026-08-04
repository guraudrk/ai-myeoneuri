import Voice, { type SpeechResultsEvent, type SpeechErrorEvent } from "@react-native-voice/voice";
import type { SpeechInputAdapter } from "./SpeechInputAdapter";

export function createRealSpeechAdapter(): SpeechInputAdapter {
  return {
    async isAvailable() {
      try {
        const available = await Voice.isAvailable();
        return !!available;
      } catch {
        return false;
      }
    },

    async startListening(onResult, onError) {
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        const text = e.value?.[0];
        if (text) onResult(text);
      };
      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        onError(e.error?.message ?? "음성 인식 오류");
      };
      try {
        await Voice.start("ko-KR");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "음성 인식을 시작할 수 없어요";
        onError(msg);
      }
    },

    async stopListening() {
      try {
        await Voice.stop();
        await Voice.destroy();
      } catch {}
    },
  };
}
