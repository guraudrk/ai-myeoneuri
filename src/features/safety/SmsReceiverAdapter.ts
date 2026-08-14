import { NativeModules, NativeEventEmitter, Platform } from "react-native";

export interface SmsEvent {
  sender: string;
  body: string;
}

const { SmsListener } = NativeModules;

function isSupported(): boolean {
  return Platform.OS === "android" && !!SmsListener;
}

let emitter: NativeEventEmitter | null = null;

export function startSmsListening(): void {
  if (!isSupported()) return;
  SmsListener.startListening();
  if (!emitter) emitter = new NativeEventEmitter(SmsListener);
}

export function stopSmsListening(): void {
  if (!isSupported()) return;
  SmsListener.stopListening();
}

export function addSmsListener(handler: (event: SmsEvent) => void): () => void {
  if (!isSupported()) return () => {};
  if (!emitter) emitter = new NativeEventEmitter(SmsListener);
  const sub = emitter.addListener("SmsReceived", handler);
  return () => sub.remove();
}
