// Pretendard (assets/fonts/Pretendard-*.ttf — silverlink-web-input node_modules에서 복사)
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const BASE_WIDTH = 390;                                          // Galaxy S24 기준
// 갤A15(360dp) → ×0.92, 갤S24(393dp) → ×1.0, 대화면 상한 ×1.1
const s = (n: number) =>
  Math.round(n * Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.1));

// SilverLink 디자인 시스템과 동일한 팔레트 (--sl-* 변수 기준)
export const Colors = {
  background:       "#F5F7FB",   // --sl-bg
  surface:          "#FFFFFF",
  surfaceSecondary: "#EEF2FF",   // --sl-primary-tint
  border:           "#E7EBF3",   // --sl-border

  textPrimary:      "#101828",   // --sl-ink
  textSecondary:    "#344054",   // --sl-body-strong
  textMuted:        "#667085",   // --sl-muted
  placeholder:      "#98A2B3",   // --sl-placeholder

  primary:          "#2E5BFF",   // --sl-primary
  primaryDeep:      "#234AE0",   // --sl-primary-hover
  primaryTint:      "#EEF2FF",   // --sl-primary-tint
  accentWarm:       "#FFC531",   // 마이크 링·포인트 강조 (SilverLink 외)

  navyDeep:         "#25409E",   // 사용 보류 (이전 홈 배경색)
  navyMid:          "#3E5FC9",

  danger:           "#F04438",   // --sl-danger
  dangerDeep:       "#C7291F",
  dangerTint:       "#FEF3F2",
  dangerBg:         "#FEF3F2",
  success:          "#12B76A",   // --sl-success
  successBg:        "#ECFDF5",
  successText:      "#065F46",
} as const;

export const FontFamily = {
  heading:       "Pretendard-Bold",
  headingMedium: "Pretendard-SemiBold",
  body:          "Pretendard-Medium",
  bodyRegular:   "Pretendard-Regular",
} as const;

export const FontSize = {
  body:         s(20),
  heading:      s(24),
  headingLarge: s(34),
  buttonLabel:  s(20),
  caption:      s(16),
  label:        s(14),
  phone:        s(28),
};

export const LineHeight = {
  body:         s(28),
  heading:      s(32),
  headingLarge: s(44),
  buttonLabel:  s(26),
  caption:      s(22),
  phone:        s(34),
};

export const TouchSize = {
  minimum:    56,        // 접근성 최소값 — 고정
  microphone: s(168),
};

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
  xl:   28,   // 시트 상단 모서리용
  pill: 100,
} as const;

export const Shadow = {
  card: {
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: "#2E5BFF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  mic: {
    shadowColor: "#2E5BFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;
