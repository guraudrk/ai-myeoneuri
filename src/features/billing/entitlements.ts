/**
 * B-2 결제 단일 진실 소스
 * 모든 유료 기능은 hasEntitlement() 로만 게이트한다.
 * 결제 UI는 어르신 폰 메인 화면에 절대 뜨지 않는다.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type EntitlementKey = "safety_guard" | "safety_plus_guard";

const CACHE_KEY = "@silverlink/entitlements_cache";
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3일

interface EntitlementCache {
  active: EntitlementKey[];
  checkedAt: string;
}

let _memCache: EntitlementCache | null = null;

export async function loadEntitlementCache(): Promise<EntitlementCache | null> {
  if (_memCache) return _memCache;
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    _memCache = JSON.parse(raw) as EntitlementCache;
    return _memCache;
  } catch {
    return null;
  }
}

export async function saveEntitlementCache(active: EntitlementKey[]): Promise<void> {
  const cache: EntitlementCache = { active, checkedAt: new Date().toISOString() };
  _memCache = cache;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * 유료 기능 게이트. 항상 이 함수를 통해 체크한다.
 * 네트워크 오프라인 상태에서는 grace period(3일) 동안 캐시로 동작한다.
 */
export async function hasEntitlement(key: EntitlementKey): Promise<boolean> {
  const cache = await loadEntitlementCache();
  if (!cache) return false;

  const ageMs = Date.now() - new Date(cache.checkedAt).getTime();
  if (ageMs > GRACE_PERIOD_MS) return false;

  return cache.active.includes(key);
}

/** 메모리 캐시 초기화 (로그아웃 또는 구독 변경 직후 호출) */
export function invalidateEntitlementCache(): void {
  _memCache = null;
}
