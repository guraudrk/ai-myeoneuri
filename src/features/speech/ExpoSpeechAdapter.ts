import { NativeModules, DeviceEventEmitter, PermissionsAndroid, Platform } from "react-native";
import type { SpeechInputAdapter } from "./SpeechInputAdapter";

const { NativeSpeechRecognition } = NativeModules;

export function createExpoSpeechAdapter(): SpeechInputAdapter {
  return {
    async isAvailable() {
      if (Platform.OS !== "android") return false;
      if (!NativeSpeechRecognition) return false;
      try {
        const status = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        return status;
      } catch {
        return false;
      }
    },

    async startListening(onResult, onError) {
      if (!NativeSpeechRecognition) {
        onError("음성 인식 모듈을 로드할 수 없어요");
        return;
      }

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "마이크 권한",
            message: "AI 며느리가 음성 명령을 인식하기 위해 마이크를 사용합니다.",
            buttonPositive: "허용",
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          onError("마이크 권한이 없어요");
          return;
        }
      }

      const resultSub = DeviceEventEmitter.addListener("speechResult", (event) => {
        resultSub.remove();
        errorSub.remove();
        onResult(event.value as string);
      });

      const errorSub = DeviceEventEmitter.addListener("speechError", (event) => {
        resultSub.remove();
        errorSub.remove();
        const code = event.value as string;
        const msg = code === "PERMISSION_DENIED"
          ? "마이크 권한이 없어요"
          : code === "NO_MATCH" || code === "SPEECH_TIMEOUT"
          ? "인식하지 못했어요. 다시 말씀해 주세요."
          : code === "NETWORK_ERROR" || code === "NETWORK_TIMEOUT"
          ? "네트워크를 확인해 주세요."
          : "음성 인식 오류: " + code;
        onError(msg);
      });

      NativeSpeechRecognition.startListening();
    },

    async stopListening() {
      NativeSpeechRecognition?.stopListening();
    },
  };
}
