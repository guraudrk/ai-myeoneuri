import AsyncStorage from "@react-native-async-storage/async-storage";

export type LogEntry = {
  id: string;
  emoji: string;
  summary: string;
  timestamp: number;
};

const KEY = "conversation_log_v1";
const MAX_ENTRIES = 20;

export async function addLog(emoji: string, summary: string): Promise<void> {
  const existing = await getLogs();
  const entry: LogEntry = { id: `${Date.now()}`, emoji, summary, timestamp: Date.now() };
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function getLogs(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

export async function getTodayLogs(): Promise<LogEntry[]> {
  const all = await getLogs();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return all.filter((e) => e.timestamp >= todayStart.getTime());
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatLogEntry(entry: LogEntry): string {
  return `${entry.emoji} ${entry.summary} (${formatTime(entry.timestamp)})`;
}
