import * as Speech from "expo-speech";

let _isSpeaking = false;

/**
 * 텍스트를 어르신이 듣기 편한 말로 변환한다.
 * - 기호 → 한국어 발음 (%, ℃, →, ·)
 * - 마크다운 제거
 * - 문장 수 제한 (최대 4문장)
 */
export function prepareForSpeech(raw: string): string {
  let t = raw
    // 마크다운 제거
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    // 글머리 기호 → 공백
    .replace(/^\s*[-*•]\s+/gm, " ")
    .replace(/^\s*\d+[.)]\s+/gm, " ")
    // 기호 → 한국어
    .replace(/%/g, "퍼센트")
    .replace(/℃|°C/g, "도")
    .replace(/℉|°F/g, "도 화씨")
    .replace(/→|➡/g, "에서")
    .replace(/←/g, "로")
    .replace(/·|•/g, " ")
    .replace(/\$/g, "달러 ")
    .replace(/₩/g, "원 ")
    .replace(/&/g, "와")
    .replace(/\//g, " 또는 ")
    // 연속 공백·개행 정리
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // 문장 4개 초과 시 잘라냄 (어르신이 집중할 수 있는 최대치)
  const sentences = t.match(/[^.!?]+[.!?]+/g) ?? [t];
  if (sentences.length > 4) {
    t = sentences.slice(0, 4).join(" ").trim();
  }

  return t;
}

export async function speak(text: string): Promise<void> {
  const prepared = prepareForSpeech(text);
  await Speech.stop();
  _isSpeaking = true;
  return new Promise((resolve) => {
    Speech.speak(prepared, {
      language: "ko-KR",
      rate: 0.82,   // 0.85 → 0.82 — 어르신 청취 속도, 약간 더 여유 있게
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
