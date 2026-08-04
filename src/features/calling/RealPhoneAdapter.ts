import { Linking } from "react-native";
import type { PhoneAdapter, DialResult } from "./PhoneAdapter";

export function createRealPhoneAdapter(): PhoneAdapter {
  return {
    async openDialer(phoneNumber: string): Promise<DialResult> {
      const url = `tel:${phoneNumber.replace(/\s/g, "")}`;
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          return { outcome: "error", errorMessage: "전화 앱을 열 수 없어요." };
        }
        await Linking.openURL(url);
        return { outcome: "dialer_opened" };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { outcome: "error", errorMessage: msg };
      }
    },
  };
}
