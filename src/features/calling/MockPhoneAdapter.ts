import type { PhoneAdapter, DialResult } from "./PhoneAdapter";

export function createMockPhoneAdapter(
  shouldFail = false
): PhoneAdapter {
  return {
    async openDialer(_phoneNumber: string): Promise<DialResult> {
      if (shouldFail) {
        return { outcome: "error", errorMessage: "Dialer를 열 수 없어요." };
      }
      return { outcome: "dialer_opened" };
    },
  };
}
