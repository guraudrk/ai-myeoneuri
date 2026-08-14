import AsyncStorage from "@react-native-async-storage/async-storage";

const BASELINE_KEY = "@silverlink/usage_baseline_v1";
const DISMISSED_KEY = "@silverlink/anomaly_dismissed_v1";
const ENABLED_KEY = "@silverlink/anomaly_enabled_v1";
const LEARNING_DAYS = 14;

export interface DailyUsageSample {
  date: string;          // "YYYY-MM-DD"
  firstUsageHour: number | null; // 0-23, null = 미사용
  totalForegroundMin: number;
}

interface Baseline {
  samples: DailyUsageSample[];
  avgFirstHour: number | null;
  avgForegroundMin: number;
  learningComplete: boolean;
}

export type AnomalyLevel = "none" | "mild" | "significant";

// 기준선 학습 완료 기준: LEARNING_DAYS일치 샘플 보유
function computeStats(samples: DailyUsageSample[]): Pick<Baseline, "avgFirstHour" | "avgForegroundMin"> {
  const withHour = samples.filter(s => s.firstUsageHour !== null);
  const avgFirstHour = withHour.length > 0
    ? withHour.reduce((sum, s) => sum + s.firstUsageHour!, 0) / withHour.length
    : null;
  const avgForegroundMin = samples.length > 0
    ? samples.reduce((sum, s) => sum + s.totalForegroundMin, 0) / samples.length
    : 0;
  return { avgFirstHour, avgForegroundMin };
}

async function loadBaseline(): Promise<Baseline> {
  const raw = await AsyncStorage.getItem(BASELINE_KEY);
  if (!raw) return { samples: [], avgFirstHour: null, avgForegroundMin: 0, learningComplete: false };
  try { return JSON.parse(raw) as Baseline; }
  catch { return { samples: [], avgFirstHour: null, avgForegroundMin: 0, learningComplete: false }; }
}

async function saveBaseline(b: Baseline): Promise<void> {
  await AsyncStorage.setItem(BASELINE_KEY, JSON.stringify(b));
}

export async function recordDailyUsage(sample: DailyUsageSample): Promise<void> {
  const b = await loadBaseline();
  const idx = b.samples.findIndex(s => s.date === sample.date);
  if (idx >= 0) {
    b.samples[idx] = sample;
  } else {
    b.samples.push(sample);
    if (b.samples.length > 90) b.samples = b.samples.slice(-90);
  }
  const recent = b.samples.slice(-LEARNING_DAYS);
  const stats = computeStats(recent);
  await saveBaseline({
    ...stats,
    samples: b.samples,
    learningComplete: b.samples.length >= LEARNING_DAYS,
  });
}

// 오늘 샘플과 기준선 비교 → 이탈 수준 반환
export async function detectAnomaly(
  today: DailyUsageSample,
  nowHour?: number
): Promise<AnomalyLevel> {
  const b = await loadBaseline();
  if (!b.learningComplete) return "none";

  const currentHour = today.firstUsageHour;
  const checkHour = nowHour ?? new Date().getHours();

  // 첫 사용 시각 이탈 판정
  if (b.avgFirstHour !== null) {
    if (currentHour === null) {
      // 아직 폰을 안 켰는데 평소보다 4시간 이상 지남
      if (checkHour > b.avgFirstHour + 4) return "significant";
    } else if (currentHour > b.avgFirstHour + 3) {
      return "mild";
    }
  }

  // 사용 시간 이탈: 평균의 30% 미만 (최소 10분 사용하던 사람 기준)
  if (b.avgForegroundMin > 10 && today.totalForegroundMin < b.avgForegroundMin * 0.3) {
    return "mild";
  }

  return "none";
}

export async function markAnomalyDismissed(date: string): Promise<void> {
  const raw = await AsyncStorage.getItem(DISMISSED_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  if (!list.includes(date)) list.push(date);
  await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(list.slice(-30)));
}

export async function isAnomalyDismissed(date: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(DISMISSED_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  return list.includes(date);
}

export async function isAnomalyDetectionEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ENABLED_KEY);
  if (raw === null) return true; // 기본값 on
  return raw === "true";
}

export async function setAnomalyDetectionEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
}
