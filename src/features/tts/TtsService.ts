import * as Speech from "expo-speech";

let _isSpeaking = false;

// undefined = 아직 조회 안 함 / null = 없음(기기 기본 사용) / string = 선택된 voice ID
let _cachedVoiceId: string | null | undefined = undefined;

// 삼성·구글 TTS 여성 보이스에서 흔히 나타나는 식별자 패턴
const FEMALE_HINTS = [
  "female", "woman",
  "heami", "hemi", "jiyun", "yuna", "nara", "seoyeon", "yurae", "sujin",  // Samsung
  "ko-kr-x-ism", "ko-kr-x-koc",  // Google Wavenet female Korean
];

async function getBestKoreanVoice(): Promise<string | undefined> {
  if (_cachedVoiceId !== undefined) return _cachedVoiceId ?? undefined;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const korean = voices.filter((v) => v.language.toLowerCase().startsWith("ko"));

    // 1순위: Enhanced 품질 + 여성 힌트
    const enhancedFemale = korean.find(
      (v) => v.quality === "Enhanced" && FEMALE_HINTS.some((h) => (v.identifier + v.name).toLowerCase().includes(h))
    );
    if (enhancedFemale) { _cachedVoiceId = enhancedFemale.identifier; return _cachedVoiceId; }

    // 2순위: Enhanced 품질 (성별 무관)
    const enhanced = korean.find((v) => v.quality === "Enhanced");
    if (enhanced) { _cachedVoiceId = enhanced.identifier; return _cachedVoiceId; }

    // 3순위: 여성 힌트 있는 아무 한국어 보이스
    const female = korean.find((v) => FEMALE_HINTS.some((h) => (v.identifier + v.name).toLowerCase().includes(h)));
    if (female) { _cachedVoiceId = female.identifier; return _cachedVoiceId; }

    // 4순위: 첫 번째 한국어 보이스
    _cachedVoiceId = korean[0]?.identifier ?? null;
  } catch {
    _cachedVoiceId = null;
  }
  return _cachedVoiceId ?? undefined;
}

/**
 * 텍스트를 어르신이 듣기 편한 말로 변환한다.
 * - 기호 → 한국어 발음 (%, ℃, →, ·)
 * - 마크다운 제거
 * - 문장 수 제한 (최대 4문장)
 */
export function prepareForSpeech(raw: string, maxSentences = 4): string {
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

  const sentences = t.match(/[^.!?]+[.!?]+/g) ?? [t];
  if (sentences.length > maxSentences) {
    t = sentences.slice(0, maxSentences).join(" ").trim();
  }

  return t;
}

export async function speak(text: string, opts?: { maxSentences?: number }): Promise<void> {
  const prepared = prepareForSpeech(text, opts?.maxSentences ?? 4);
  const voiceId = await getBestKoreanVoice();
  await Speech.stop();
  _isSpeaking = true;
  return new Promise((resolve) => {
    Speech.speak(prepared, {
      language: "ko-KR",
      voice: voiceId,      // 기기에서 가장 좋은 한국어 보이스 자동 선택
      rate: 0.82,
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
