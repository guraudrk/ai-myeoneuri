import type { BusinessSearchAdapter, BusinessCandidate } from "@/features/business/BusinessSearchAdapter";
import type { LocationAdapter } from "@/features/location/LocationAdapter";
import type { PhoneAdapter } from "@/features/calling/PhoneAdapter";
import { isDuplicate, markExecuted } from "@/security/dedup";
import { logEntry } from "@/features/audit/auditLog";

export type SearchBusinessResult =
  | { status: "location_denied" }
  | { status: "no_results" }
  | { status: "search_error"; reason: string }
  | { status: "candidates"; candidates: BusinessCandidate[] };

export type DialBusinessResult =
  | { status: "duplicate_blocked" }
  | { status: "dialer_opened"; businessName: string }
  | { status: "error"; message: string };

export async function searchBusinesses(
  query: string,
  locationAdapter: LocationAdapter,
  businessAdapter: BusinessSearchAdapter
): Promise<SearchBusinessResult> {
  const permStatus = await locationAdapter.getPermissionStatus();
  let position: { lat: number; lng: number } | null = null;

  if (permStatus !== "granted") {
    const requested = await locationAdapter.requestPermission();
    if (requested !== "granted") {
      return { status: "location_denied" };
    }
  }

  position = await locationAdapter.getCurrentPosition();

  let candidates: BusinessCandidate[];
  try {
    candidates = await businessAdapter.search(query, position ?? undefined);
  } catch (e) {
    return { status: "search_error", reason: e instanceof Error ? e.message : String(e) };
  }

  if (candidates.length === 0) {
    return { status: "no_results" };
  }
  return { status: "candidates", candidates: candidates.slice(0, 3) };
}

export async function dialBusiness(
  requestId: string,
  business: BusinessCandidate,
  phoneAdapter: PhoneAdapter
): Promise<DialBusinessResult> {
  if (isDuplicate(requestId, "call_business")) {
    return { status: "duplicate_blocked" };
  }

  const result = await phoneAdapter.openDialer(business.phone);
  markExecuted(requestId, "call_business");

  logEntry({
    requestId,
    timestamp: new Date().toISOString(),
    intent: "call_business",
    outcome: result.outcome === "dialer_opened" ? "completed" : "error",
    detail: `${business.name} ${business.maskedPhone}`,
  });

  if (result.outcome === "dialer_opened") {
    return { status: "dialer_opened", businessName: business.name };
  }
  return { status: "error", message: result.errorMessage ?? "알 수 없는 오류" };
}
