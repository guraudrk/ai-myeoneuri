import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const KEY_ENABLED = "@ai_myeoneuri/daily_greeting_enabled_v1";
const KEY_HOUR    = "@ai_myeoneuri/daily_greeting_hour_v1";
const KEY_MINUTE  = "@ai_myeoneuri/daily_greeting_minute_v1";

export const DEFAULT_HOUR   = 10;
export const DEFAULT_MINUTE = 0;

export async function isDailyGreetingEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY_ENABLED).catch(() => null);
  return v !== "false";                             // 기본값 true
}

export async function getDailyGreetingTime(): Promise<{ hour: number; minute: number }> {
  const h = parseInt((await AsyncStorage.getItem(KEY_HOUR).catch(() => null)) ?? `${DEFAULT_HOUR}`, 10);
  const m = parseInt((await AsyncStorage.getItem(KEY_MINUTE).catch(() => null)) ?? `${DEFAULT_MINUTE}`, 10);
  return { hour: isNaN(h) ? DEFAULT_HOUR : h, minute: isNaN(m) ? DEFAULT_MINUTE : m };
}

/** 알림 권한 요청 후 daily 알림을 예약한다. iOS에서도 동작하지만 주 타깃은 Android */
export async function scheduleDailyGreeting(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE
): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  // 기존 예약 알림 중 우리 것만 취소 (identifier로 구분)
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of existing) {
    if (n.identifier === "daily_greeting") {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    identifier: "daily_greeting",
    content: {
      title: "AI 며느리",
      body: "오늘 전화하실 분 있으세요?",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(KEY_ENABLED, "true");
  await AsyncStorage.setItem(KEY_HOUR, `${hour}`);
  await AsyncStorage.setItem(KEY_MINUTE, `${minute}`);
  return true;
}

export async function cancelDailyGreeting(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("daily_greeting").catch(() => {});
  await AsyncStorage.setItem(KEY_ENABLED, "false");
}

export async function syncDailyGreeting(): Promise<void> {
  const enabled = await isDailyGreetingEnabled();
  if (!enabled) {
    await cancelDailyGreeting();
    return;
  }
  const { hour, minute } = await getDailyGreetingTime();
  await scheduleDailyGreeting(hour, minute);
}
