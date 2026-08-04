export const Colors = {
  background: "#F0F4F8",
  surface: "#FFFFFF",
  border: "#E2E8F0",

  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textStrong: "#1E293B",
  textMuted: "#94A3B8",
  placeholder: "#CBD5E1",

  primary: "#2563EB",
  primaryPressed: "#1D4ED8",
  primaryTint: "#EFF6FF",
  primaryBorder: "#BFDBFE",

  navyDeep: "#0F1F4B",
  navyMid: "#1B2660",

  success: "#10B981",
  successBg: "#ECFDF5",
  successText: "#065F46",

  warning: "#F59E0B",
  warningBg: "#FFFBEB",

  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
} as const;

export const Shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  button: {
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  mic: {
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

export const FontSize = {
  body: 20,
  heading: 24,
  headingLarge: 28,
  buttonLabel: 20,
  caption: 16,
  label: 14,
} as const;

export const TouchSize = {
  minimum: 56,
  microphone: 144,
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
  sm: 10,
  md: 14,
  lg: 18,
  pill: 100,
} as const;
