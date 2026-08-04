import * as Contacts from "expo-contacts";
import type { ContactsAdapter } from "./ContactsAdapter";
import type { ContactCandidate } from "@/domain/types";
import { maskPhoneNumber } from "@/features/audit/auditLog";

export function createRealContactsAdapter(): ContactsAdapter {
  return {
    async getPermissionStatus() {
      const { status } = await Contacts.getPermissionsAsync();
      if (status === "granted") return "granted";
      if (status === "denied") return "denied";
      return "undetermined";
    },

    async requestPermission() {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === "granted" ? "granted" : "denied";
    },

    async searchContacts(query: string): Promise<ContactCandidate[]> {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        name: query || undefined,
      });

      return data
        .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
        .map((c) => {
          const phone = c.phoneNumbers![0].number ?? "";
          return {
            id: c.id ?? `${c.name}-${Math.random()}`,
            name: c.name!,
            maskedNumber: maskPhoneNumber(phone),
          };
        });
    },

    async getPhoneNumber(contactId: string): Promise<string | null> {
      const contact = await Contacts.getContactByIdAsync(contactId, [
        Contacts.Fields.PhoneNumbers,
      ]);
      return contact?.phoneNumbers?.[0]?.number ?? null;
    },
  };
}
