import type { AuditEntry } from "@/domain/types";

/** 전화번호 마스킹: 뒷자리 4자만 표시 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return "*".repeat(digits.length - 4) + digits.slice(-4);
}

/** 연락처 이름 마스킹: 성 제외 나머지 * 처리 */
export function maskContactName(name: string): string {
  if (name.length <= 1) return "*";
  return name[0] + "*".repeat(name.length - 1);
}

const entries: AuditEntry[] = [];

export function logEntry(entry: AuditEntry): void {
  entries.push(entry);
}

export function getEntries(): readonly AuditEntry[] {
  return entries;
}

/** 테스트에서 초기화용 */
export function _resetForTest(): void {
  entries.length = 0;
}
