import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY  = "@ai_myeoneuri/event_log_v1";
const SNOOZE_KEY   = "@ai_myeoneuri/rec_snooze_v1";
const SHOWN_KEY    = "@ai_myeoneuri/rec_shown_v1";
const RATE_KEY     = "@ai_myeoneuri/rec_rate_v1";

const EWMA_ALPHA = 0.3; // 최근 행동에 더 많은 가중치

export type EventType    = "call" | "app_open" | "message";
export type EventOutcome = "success" | "no_answer" | "failed";
export type EventSource  = "voice" | "tap" | "suggestion";

export interface EventLog {
  id: string;
  type: EventType;
  targetId: string;
  targetName: string;
  startedAt: number;     // ms (epoch)
  durationSec: number;
  outcome: EventOutcome;
  source: EventSource;
}

// ── 이벤트 로그 CRUD ──────────────────────────────────────────────────────────

async function readAll(): Promise<EventLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventLog[]) : [];
  } catch { return []; }
}

export async function appendEventLog(
  entry: Omit<EventLog, "id">
): Promise<void> {
  const all = await readAll();
  const log: EventLog = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  // 최대 500건, 오래된 것부터 제거
  const trimmed = [...all, log].slice(-500);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function getRecentLogs(daysBack = 30): Promise<EventLog[]> {
  const all  = await readAll();
  const cutoff = Date.now() - daysBack * 86_400_000;
  return all.filter((e) => e.startedAt >= cutoff);
}

export async function getTodayLogs(): Promise<EventLog[]> {
  const all = await readAll();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return all.filter((e) => e.startedAt >= startOfDay.getTime());
}

// ── 추천 노출 기록 ─────────────────────────────────────────────────────────────
// { [targetId]: { lastShown: ms, shownToday: number, lastDismissed: ms } }

interface ShownRecord {
  lastShown:     number;
  shownToday:    number;
  shownDate:     string;   // "YYYY-MM-DD"
  lastDismissed: number;
}
type ShownMap = Record<string, ShownRecord>;

async function readShown(): Promise<ShownMap> {
  try {
    const raw = await AsyncStorage.getItem(SHOWN_KEY);
    return raw ? (JSON.parse(raw) as ShownMap) : {};
  } catch { return {}; }
}

export async function markRecommendationShown(targetId: string): Promise<void> {
  const map = await readShown();
  const today = todayStr();
  const prev = map[targetId];
  map[targetId] = {
    lastShown:     Date.now(),
    shownToday:    (prev?.shownDate === today ? (prev.shownToday ?? 0) + 1 : 1),
    shownDate:     today,
    lastDismissed: prev?.lastDismissed ?? 0,
  };
  await AsyncStorage.setItem(SHOWN_KEY, JSON.stringify(map));
}

export async function markRecommendationDismissed(targetId: string): Promise<void> {
  const map = await readShown();
  const prev = map[targetId] ?? { lastShown: 0, shownToday: 0, shownDate: "", lastDismissed: 0 };
  map[targetId] = { ...prev, lastDismissed: Date.now() };
  await AsyncStorage.setItem(SHOWN_KEY, JSON.stringify(map));
  await updateAcceptanceRate(targetId, false);
}

export async function markRecommendationAccepted(targetId: string): Promise<void> {
  await updateAcceptanceRate(targetId, true);
}

export async function getShownMap(): Promise<ShownMap> {
  return readShown();
}

// ── 스누즈 ─────────────────────────────────────────────────────────────────────
// { [targetId]: snoozedUntil (ms) }
type SnoozeMap = Record<string, number>;

async function readSnooze(): Promise<SnoozeMap> {
  try {
    const raw = await AsyncStorage.getItem(SNOOZE_KEY);
    return raw ? (JSON.parse(raw) as SnoozeMap) : {};
  } catch { return {}; }
}

export async function snoozeRecommendation(targetId: string, days = 3): Promise<void> {
  const map = await readSnooze();
  map[targetId] = Date.now() + days * 86_400_000;
  await AsyncStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
  await markRecommendationDismissed(targetId);
}

export async function getSnoozeMap(): Promise<SnoozeMap> {
  return readSnooze();
}

// ── EWMA 수락률 ────────────────────────────────────────────────────────────────
// { [targetId]: rate (0~1) }
type RateMap = Record<string, number>;

async function readRates(): Promise<RateMap> {
  try {
    const raw = await AsyncStorage.getItem(RATE_KEY);
    return raw ? (JSON.parse(raw) as RateMap) : {};
  } catch { return {}; }
}

async function updateAcceptanceRate(targetId: string, accepted: boolean): Promise<void> {
  const map = await readRates();
  const prev = map[targetId] ?? 0.5;                       // cold start 0.5
  map[targetId] = EWMA_ALPHA * (accepted ? 1 : 0) + (1 - EWMA_ALPHA) * prev;
  await AsyncStorage.setItem(RATE_KEY, JSON.stringify(map));
}

export async function getAcceptanceRates(): Promise<RateMap> {
  return readRates();
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
