import { NativeModules, NativeEventEmitter, Platform } from "react-native";

export interface KeywordDetectedEvent {
  keyword: string;
}

const { CallKeyword } = NativeModules;

function isSupported(): boolean {
  return Platform.OS === "android" && !!CallKeyword;
}

let emitter: NativeEventEmitter | null = null;

export function startKeywordListening(): void {
  if (!isSupported()) return;
  CallKeyword.startListening();
  if (!emitter) emitter = new NativeEventEmitter(CallKeyword);
}

export function stopKeywordListening(): void {
  if (!isSupported()) return;
  CallKeyword.stopListening();
}

export function addKeywordListener(
  handler: (event: KeywordDetectedEvent) => void
): () => void {
  if (!isSupported()) return () => {};
  if (!emitter) emitter = new NativeEventEmitter(CallKeyword);
  const sub = emitter.addListener("KeywordDetected", handler);
  return () => sub.remove();
}
