import type { SpeechInputAdapter } from "./SpeechInputAdapter";

// 네이티브 모듈 로딩 실패 시 앱 전체가 죽지 않도록 lazy require
function getVoice() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-voice/voice").default as typeof import("@react-native-voice/voice").default;
  } catch {
    return null;
  }
}

export function createRealSpeechAdapter(): SpeechInputAdapter {
  return {
    async isAvailable() {
      try {
        const Voice = getVoice();
        if (!Voice) return false;
        const available = await Voice.isAvailable();
        return !!available;
      } catch {
        return false;
      }
    },

    async startListening(onResult, onError) {
      const Voice = getVoice();
      if (!Voice) {
        onError("음성 인식을 사용할 수 없어요");
        return;
      }
      try {
        Voice.onSpeechResults = (e: { value?: string[] }) => {
          const text = e.value?.[0];
          if (text) onResult(text);
        };
        Voice.onSpeechError = (e: { error?: { message?: string } }) => {
          onError(e.error?.message ?? "음성 인식 오류");
        };
        await Voice.start("ko-KR");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "음성 인식을 시작할 수 없어요";
        onError(msg);
      }
    },

    async stopListening() {
      const Voice = getVoice();
      if (!Voice) return;
      try {
        await Voice.stop();
        await Voice.destroy();
      } catch {}
    },
  };
}
