/**
 * L1 — 개인 캐시 (AsyncStorage, 비용 0원)
 * L3(Gemini Flash) 성공 결과를 저장해 동일 발화 재분류 시 재사용.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ParsedIntent } from "./intentParser";

const CACHE_KEY = "@silverlink/intent_cache_v1";
const MAX_ENTRIES = 500;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

interface CacheEntry {
  intent: ParsedIntent;
  savedAt: string;
}
type CacheMap = Record<string, CacheEntry>;

function normalizeKey(utterance: string): string {
  return utterance.replace(/\s+/g, " ").trim().toLowerCase();
}

async function loadCache(): Promise<CacheMap> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as CacheMap; }
  catch { return {}; }
}

export async function getFromL1Cache(utterance: string): Promise<ParsedIntent | null> {
  const key = normalizeKey(utterance);
  const cache = await loadCache();
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - new Date(entry.savedAt).getTime() > TTL_MS) return null;
  return { ...entry.intent, resolved_by: "L1" };
}

export async function saveToL1Cache(utterance: string, intent: ParsedIntent): Promise<void> {
  // unknown은 캐시하지 않는다
  if (intent.intent === "unknown") return;

  const key = normalizeKey(utterance);
  const cache = await loadCache();

  // 최대 엔트리 초과 시 오래된 것부터 drop
  const entries = Object.entries(cache);
  if (entries.length >= MAX_ENTRIES) {
    entries.sort((a, b) =>
      new Date(a[1].savedAt).getTime() - new Date(b[1].savedAt).getTime()
    );
    const trimmed = Object.fromEntries(entries.slice(entries.length - MAX_ENTRIES + 1));
    trimmed[key] = { intent, savedAt: new Date().toISOString() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    return;
  }

  cache[key] = { intent, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// B-7: 사용자가 직접 정정한 인텐트를 L1에 강제 저장 (unknown 체크 없음)
export async function correctL1Cache(utterance: string, intent: ParsedIntent): Promise<void> {
  const key = normalizeKey(utterance);
  const cache = await loadCache();
  const entries = Object.entries(cache);
  if (entries.length >= MAX_ENTRIES) {
    entries.sort((a, b) =>
      new Date(a[1].savedAt).getTime() - new Date(b[1].savedAt).getTime()
    );
    const trimmed = Object.fromEntries(entries.slice(entries.length - MAX_ENTRIES + 1));
    trimmed[key] = { intent, savedAt: new Date().toISOString() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    return;
  }
  cache[key] = { intent, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}
