import * as Contacts from "expo-contacts";

/** 끝 8자리 기준으로 번호를 정규화 (국가코드·하이픈 제거) */
function normalize(n: string): string {
  return n.replace(/\D/g, "").slice(-8);
}

/**
 * 수신 전화번호가 연락처에 저장되어 있으면 true를 반환한다.
 * 연락처 권한이 없으면 true를 반환 (경고 생략 — 권한 없을 때 알림 범람 방지).
 */
export async function isNumberInContacts(incomingNumber: string): Promise<boolean> {
  if (!incomingNumber) return true;
  try {
    const perm = await Contacts.getPermissionsAsync();
    if (perm.status !== "granted") return true;
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });
    const target = normalize(incomingNumber);
    if (!target) return true;
    return data.some((c) =>
      c.phoneNumbers?.some((p) => normalize(p.number ?? "") === target)
    );
  } catch {
    return true; // 오류 시 경고 생략 (false positive 허용하지 않음)
  }
}
