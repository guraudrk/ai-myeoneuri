import type { ContactsAdapter } from "./ContactsAdapter";
import type { ContactCandidate } from "@/domain/types";
import { maskPhoneNumber } from "@/features/audit/auditLog";

const MOCK_CONTACTS: Array<{ id: string; name: string; phone: string }> = [
  { id: "1", name: "딸 이지은", phone: "01012345678" },
  { id: "2", name: "아들 이민수", phone: "01098765432" },
  { id: "3", name: "이지은 회사", phone: "0212345678" },
  { id: "4", name: "딸 친구 김영희", phone: "01055556666" },
];

let mockPermission: "granted" | "denied" | "undetermined" = "undetermined";

export function setMockPermission(
  status: "granted" | "denied" | "undetermined"
): void {
  mockPermission = status;
}

export function createMockContactsAdapter(): ContactsAdapter {
  return {
    async getPermissionStatus() {
      return mockPermission;
    },

    async requestPermission() {
      if (mockPermission === "undetermined") {
        mockPermission = "granted";
      }
      return mockPermission === "granted" ? "granted" : "denied";
    },

    async searchContacts(query: string): Promise<ContactCandidate[]> {
      const lower = query.toLowerCase();
      const matches = MOCK_CONTACTS.filter((c) =>
        c.name.toLowerCase().includes(lower)
      );
      return matches.slice(0, 3).map((c) => ({
        id: c.id,
        name: c.name,
        maskedNumber: maskPhoneNumber(c.phone),
      }));
    },

    async getPhoneNumber(contactId: string): Promise<string | null> {
      return MOCK_CONTACTS.find((c) => c.id === contactId)?.phone ?? null;
    },
  };
}
