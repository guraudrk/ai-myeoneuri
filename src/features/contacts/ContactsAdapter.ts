import type { ContactCandidate } from "@/domain/types";

export interface ContactsAdapter {
  /** 연락처 권한 현재 상태 */
  getPermissionStatus(): Promise<"granted" | "denied" | "undetermined">;
  /** 권한 요청 */
  requestPermission(): Promise<"granted" | "denied">;
  /** 쿼리로 연락처 검색. 최대 3개 반환. */
  searchContacts(query: string): Promise<ContactCandidate[]>;
  /** ID로 실제 전화번호 조회 (표시하지 않고 PhoneAdapter에 전달용) */
  getPhoneNumber(contactId: string): Promise<string | null>;
}
