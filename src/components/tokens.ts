/** SilverLink Blue·Navy Design Token */
export const Colors = {
  background: "#F5F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF2FF",
  border: "#E7EBF3",

  textPrimary: "#101828",
  textSecondary: "#475467",
  textStrong: "#344054",
  textMuted: "#667085",
  placeholder: "#98A2B3",

  primary: "#2E5BFF",
  primaryPressed: "#234AE0",
  primaryTint: "#EEF2FF",
  primaryBorder: "#DCE4FF",

  navyDeep: "#12183F",
  navyMid: "#1B2660",
  accentBlue: "#5B8CFF",

  success: "#12B76A",
  successBg: "#ECFDF3",
  successText: "#087443",

  warning: "#F79009",
  warningBg: "#FFFAEB",

  danger: "#F04438",
  dangerBg: "#FEF3F2",
  dangerBorder: "#FECDCA",
} as const;

/** 접근성 기준 폰트 크기 */
export const FontSize = {
  body: 20,
  heading: 24,
  headingLarge: 28,
  buttonLabel: 20,
  caption: 16,
} as const;

/** 터치 영역 최소 크기 (dp) */
export const TouchSize = {
  minimum: 56,
  microphone: 148,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
