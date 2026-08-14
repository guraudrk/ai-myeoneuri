/**
 * B-2 RevenueCat 래퍼
 * - 초기화: RevenueCatService.configure() 를 앱 진입점에서 1회 호출
 * - 구독 상태: syncCustomerInfo() → entitlements 캐시 갱신
 * - 구매: purchaseTier()
 * - 복원: restorePurchases()
 * API 키는 EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY 환경변수에서 읽는다.
 */

import Purchases, { LOG_LEVEL } from "react-native-purchases";
import type { PurchasesPackage } from "react-native-purchases";
import { AnalyticsService } from "../analytics/AnalyticsService";
import {
  EntitlementKey,
  invalidateEntitlementCache,
  saveEntitlementCache,
} from "./entitlements";

const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";

const ENTITLEMENT_ID_MAP: Record<string, EntitlementKey> = {
  safety_guard:      "safety_guard",
  safety_plus_guard: "safety_plus_guard",
};

export type SubscriptionTier = "safety" | "safety_plus";

function extractActiveEntitlements(
  customerInfo: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>
): EntitlementKey[] {
  return Object.keys(customerInfo.entitlements.active)
    .map((k) => ENTITLEMENT_ID_MAP[k])
    .filter((k): k is EntitlementKey => !!k);
}

export const RevenueCatService = {
  configure() {
    if (!RC_ANDROID_KEY) return;
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: RC_ANDROID_KEY });
    Purchases.addCustomerInfoUpdateListener(async (info) => {
      const active = extractActiveEntitlements(info);
      await saveEntitlementCache(active);
    });
  },

  async syncCustomerInfo(): Promise<EntitlementKey[]> {
    if (!RC_ANDROID_KEY) return [];
    const info = await Purchases.getCustomerInfo();
    const active = extractActiveEntitlements(info);
    await saveEntitlementCache(active);
    return active;
  },

  async getOfferings() {
    if (!RC_ANDROID_KEY) return null;
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  },

  async purchaseTier(pkg: PurchasesPackage, tier: SubscriptionTier): Promise<boolean> {
    await AnalyticsService.track("subscribe_started", { tier }).catch(() => {});
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = extractActiveEntitlements(customerInfo);
    await saveEntitlementCache(active);
    invalidateEntitlementCache();
    await saveEntitlementCache(active);
    const succeeded = active.length > 0;
    if (succeeded) {
      await AnalyticsService.track("subscribe_completed", { tier }).catch(() => {});
    }
    return succeeded;
  },

  async restorePurchases(): Promise<EntitlementKey[]> {
    if (!RC_ANDROID_KEY) return [];
    const info = await Purchases.restorePurchases();
    const active = extractActiveEntitlements(info);
    invalidateEntitlementCache();
    await saveEntitlementCache(active);
    return active;
  },
};
