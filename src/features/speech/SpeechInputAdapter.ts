export interface SpeechInputAdapter {
  isAvailable(): Promise<boolean>;
  startListening(
    onResult: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void>;
  stopListening(): Promise<void>;
}
