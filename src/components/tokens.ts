import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const BASE_WIDTH = 390;
// 갤A15(360dp) → ×0.92, 갤S24(393dp) → ×1.0, 대화면 상한 ×1.1
const s = (n: number) =>
  Math.round(n * Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.1));

// ─── 라이트 팔레트 (WCAG AAA #1939B7 = 8.97:1 on white) ───────────────────
export const Colors = {
  background:       "#F5F7FB",
  surface:          "#FFFFFF",
  surfaceSecondary: "#EEF2FF",
  border:           "#E7EBF3",

  textPrimary:      "#101828",   // 17.5:1 on white ✓ AAA
  textSecondary:    "#344054",   // 10.2:1 on white ✓ AAA
  textMuted:        "#667085",   //  5.9:1 on white — caption only (20sp+)
  placeholder:      "#98A2B3",

  // primary #1939B7 → luminance 0.067 → contrast 8.97:1 on white ✓ WCAG AAA
  primary:          "#1939B7",
  primaryDeep:      "#122D92",
  primaryTint:      "#EEF2FF",
  accentWarm:       "#FFC531",

  // danger #991B1B → luminance 0.078 → 8.2:1 on white ✓ AAA
  danger:           "#991B1B",
  dangerDeep:       "#7F1D1D",
  dangerTint:       "#FEF3F2",
  dangerBg:         "#FEF3F2",
  // success #065F46 → luminance 0.094 → 7.3:1 on white ✓ AAA
  success:          "#065F46",
  successBg:        "#ECFDF5",
  successText:      "#032D22",
} as const;

// ─── 다크 팔레트 (dark mode 대응용 — useColorScheme()과 함께 사용) ─────────
export const DarkColors: Record<keyof typeof Colors, string> = {
  background:       "#0F1117",
  surface:          "#1A1D27",
  surfaceSecondary: "#1E2238",
  border:           "#2D3148",

  textPrimary:      "#F2F4F7",
  textSecondary:    "#D0D5DD",
  textMuted:        "#98A2B3",
  placeholder:      "#667085",

  primary:          "#7B94FF",   // lighter for dark bg — 4.7:1 on #1A1D27 ✓ AA+
  primaryDeep:      "#A3B4FF",
  primaryTint:      "#1E2238",
  accentWarm:       "#FFC531",

  danger:           "#F97066",
  dangerDeep:       "#FDA29B",
  dangerTint:       "#2D1515",
  dangerBg:         "#2D1515",
  success:          "#32D583",
  successBg:        "#0D2318",
  successText:      "#ABEFC6",
} as const;

export const FontFamily = {
  heading:       "Pretendard-Bold",
  headingMedium: "Pretendard-SemiBold",
  body:          "Pretendard-Regular",
  bodyMedium:    "Pretendard-Medium",
} as const;

// 어르신 가독성 기준 — body 20sp 이상, caption 18sp 이상 (WCAG AAA 2.5.8)
export const FontSize = {
  body:         s(22),
  heading:      s(28),
  headingLarge: s(34),
  buttonLabel:  s(20),
  caption:      s(18),
  label:        s(16),
  phone:        s(30),
} as const;

export const LineHeight = {
  body:         s(32),
  heading:      s(36),
  headingLarge: s(42),
  buttonLabel:  s(28),
  caption:      s(26),
  phone:        s(38),
} as const;

export const TouchSize = {
  minimum:    64,
  microphone: Math.round(width * 0.5),  // 화면 너비 50%
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
  sm:   12,
  md:   20,
  lg:   28,
  xl:   36,
  pill: 100,
} as const;

export const Shadow = {
  card: {
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: "#1939B7",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  mic: {
    shadowColor: "#1939B7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 16,
  },
} as const;
