import { NativeModules, NativeEventEmitter, Platform } from "react-native";

export interface IncomingCallEvent {
  number: string;
}

const { CallState } = NativeModules;

function isSupported(): boolean {
  return Platform.OS === "android" && !!CallState;
}

let emitter: NativeEventEmitter | null = null;

export function startCallStateListening(): void {
  if (!isSupported()) return;
  CallState.startListening();
  if (!emitter) emitter = new NativeEventEmitter(CallState);
}

export function stopCallStateListening(): void {
  if (!isSupported()) return;
  CallState.stopListening();
}

export function addIncomingCallListener(handler: (event: IncomingCallEvent) => void): () => void {
  if (!isSupported()) return () => {};
  if (!emitter) emitter = new NativeEventEmitter(CallState);
  const sub = emitter.addListener("IncomingCall", handler);
  return () => sub.remove();
}

export function addCallActiveListener(handler: () => void): () => void {
  if (!isSupported()) return () => {};
  if (!emitter) emitter = new NativeEventEmitter(CallState);
  const sub = emitter.addListener("CallActive", handler);
  return () => sub.remove();
}

export function addCallEndedListener(handler: () => void): () => void {
  if (!isSupported()) return () => {};
  if (!emitter) emitter = new NativeEventEmitter(CallState);
  const sub = emitter.addListener("CallEnded", handler);
  return () => sub.remove();
}
