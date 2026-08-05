// 구글 폰트: IBM Plex Sans KR (헤딩/브랜드) + Noto Sans KR (본문)
// 설치: expo install expo-font @expo-google-fonts/ibm-plex-sans-kr @expo-google-fonts/noto-sans-kr

export const Colors = {
  background:       "#F5F6FA",
  surface:          "#FFFFFF",
  surfaceSecondary: "#EEF3FF",   // 전화번호 박스 — 카드와 명확히 구분
  border:           "#E5E8EB",   // 구분선 (기존 유지)

  textPrimary:      "#111827",
  textSecondary:    "#374151",
  textMuted:        "#6B7280",
  placeholder:      "#CBD5E1",

  primary:          "#3D6BFF",   // 더 따뜻하고 생동감 있는 블루
  primaryDeep:      "#2748C7",   // 강조 텍스트 / 프레스 상태
  primaryTint:      "#E8EEFF",   // 아이콘 배경 / 답변 카드 배경
  accentWarm:       "#FFC531",   // 카카오 스타일 포인트 (마이크 링, 뱃지)

  navyDeep:         "#25409E",   // 홈 히어로 — 기존보다 밝고 생동감 있게
  navyMid:          "#3E5FC9",

  danger:           "#F0473E",
  dangerDeep:       "#C7291F",   // 위험 버튼 프레스 / 안전 알림 제목
  dangerTint:       "#FDEAE9",   // 안전 알림 카드 배경
  dangerBg:         "#FDEAE9",   // dangerTint 호환 별칭
  success:          "#12B886",
  successBg:        "#ECFDF5",
  successText:      "#065F46",
} as const;

export const FontFamily = {
  heading:       "IBMPlexSansKR_700Bold",
  headingMedium: "IBMPlexSansKR_600SemiBold",
  body:          "NotoSansKR_500Medium",
  bodyRegular:   "NotoSansKR_400Regular",
} as const;

export const FontSize = {
  body:         20,
  heading:      24,
  headingLarge: 34,   // 30 → 34
  buttonLabel:  20,
  caption:      16,
  label:        14,
  phone:        28,   // 26 → 28
} as const;

export const LineHeight = {
  body:         28,
  heading:      32,
  headingLarge: 44,
  buttonLabel:  26,
  caption:      22,
  phone:        34,
} as const;

export const TouchSize = {
  minimum:    56,
  microphone: 168,   // 144 → 168
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,   // 신규 — 시트 상단 모서리용
  pill: 100,
} as const;

export const Shadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: "#3D6BFF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  mic: {
    shadowColor: "#3D6BFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;
