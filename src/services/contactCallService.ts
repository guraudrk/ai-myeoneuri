import type { ContactsAdapter } from "@/features/contacts/ContactsAdapter";
import type { PhoneAdapter } from "@/features/calling/PhoneAdapter";
import type { ContactCandidate } from "@/domain/types";
import { parseContactQuery, matchesQuery } from "@/features/contacts/normalizer";
import { isDuplicate, markExecuted } from "@/security/dedup";
import { logEntry } from "@/features/audit/auditLog";
import { maskContactName, maskPhoneNumber } from "@/features/audit/auditLog";

export type SearchContactsResult =
  | { status: "permission_denied" }
  | { status: "no_results" }
  | { status: "candidates"; candidates: ContactCandidate[] };

export type DialContactResult =
  | { status: "duplicate_blocked" }
  | { status: "dialer_opened"; contactName: string }
  | { status: "phone_not_found" }
  | { status: "error"; message: string };

/**
 * 발화를 파싱해 연락처를 검색한다.
 * 결과는 최대 3개.
 */
export async function searchContacts(
  utterance: string,
  contactsAdapter: ContactsAdapter
): Promise<SearchContactsResult> {
  const permission = await contactsAdapter.getPermissionStatus();
  if (permission !== "granted") {
    const requested = await contactsAdapter.requestPermission();
    if (requested !== "granted") {
      return { status: "permission_denied" };
    }
  }

  const query = parseContactQuery(utterance);
  const searchTerm = query.relationship ?? query.name ?? query.rawQuery;
  const candidates = await contactsAdapter.searchContacts(searchTerm);

  const filtered = candidates
    .filter((c) => matchesQuery(c.name, query))
    .slice(0, 3);

  if (filtered.length === 0) {
    return { status: "no_results" };
  }

  return { status: "candidates", candidates: filtered };
}

/**
 * 사용자가 연락처를 선택한 뒤 Dialer를 연다.
 * 사용자 확인 후 호출해야 한다. 중복 실행을 차단한다.
 */
export async function dialContact(
  requestId: string,
  contactId: string,
  contactName: string,
  contactsAdapter: ContactsAdapter,
  phoneAdapter: PhoneAdapter
): Promise<DialContactResult> {
  if (isDuplicate(requestId, "call_contact")) {
    return { status: "duplicate_blocked" };
  }

  const phone = await contactsAdapter.getPhoneNumber(contactId);
  if (!phone) {
    logEntry({
      requestId,
      timestamp: new Date().toISOString(),
      intent: "call_contact",
      outcome: "error",
      detail: `연락처 번호 없음: ${maskContactName(contactName)}`,
    });
    return { status: "phone_not_found" };
  }

  const result = await phoneAdapter.openDialer(phone);
  markExecuted(requestId, "call_contact");

  logEntry({
    requestId,
    timestamp: new Date().toISOString(),
    intent: "call_contact",
    outcome: result.outcome === "dialer_opened" ? "completed" : "error",
    detail: `${maskContactName(contactName)} ${maskPhoneNumber(phone)}`,
  });

  if (result.outcome === "dialer_opened") {
    return { status: "dialer_opened", contactName };
  }
  return { status: "error", message: result.errorMessage ?? "알 수 없는 오류" };
}
