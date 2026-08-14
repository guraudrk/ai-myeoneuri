import { NativeModules, Platform } from "react-native";

interface DailyUsageRaw {
  firstUsageTime: number; // ms since epoch, -1 = 오늘 미사용
  totalForegroundMs: number;
  checkedAt: number;
}

export interface DailyUsage {
  firstUsageTime: number;
  totalForegroundMs: number;
  checkedAt: number;
}

const { UsageStats } = NativeModules;

function isSupported(): boolean {
  return Platform.OS === "android" && !!UsageStats;
}

export async function hasUsagePermission(): Promise<boolean> {
  if (!isSupported()) return false;
  return UsageStats.hasPermission();
}

export async function requestUsagePermission(): Promise<void> {
  if (!isSupported()) return;
  await UsageStats.requestPermission();
}

export async function getDailyUsage(): Promise<DailyUsage | null> {
  if (!isSupported()) return null;
  try {
    const raw: DailyUsageRaw = await UsageStats.getDailyUsage();
    return raw;
  } catch {
    return null;
  }
}
