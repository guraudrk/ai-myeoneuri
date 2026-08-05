import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Reminder = {
  id: string;
  medicineName: string;
  timeHHMM: string;
  notificationId: string;
};

const KEY = "ai_myeoneuri_reminders_v1";

export async function setupNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync("medicine_reminders", {
    name: "약 복용 알림",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#12183F",
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Reminder[]) : [];
  } catch {
    return [];
  }
}

export async function addReminder(medicineName: string, timeHHMM: string): Promise<Reminder> {
  const [hourStr, minuteStr] = timeHHMM.split(":");
  const hour = parseInt(hourStr ?? "8", 10);
  const minute = parseInt(minuteStr ?? "0", 10);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 약 복용 시간이에요",
      body: `${medicineName} 드실 시간입니다`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: "medicine_reminders",
      hour,
      minute,
    },
  });

  const reminder: Reminder = {
    id: String(Date.now()),
    medicineName,
    timeHHMM,
    notificationId,
  };
  const list = await getReminders();
  await AsyncStorage.setItem(KEY, JSON.stringify([...list, reminder]));
  return reminder;
}

export async function removeReminder(id: string): Promise<void> {
  const list = await getReminders();
  const target = list.find((r) => r.id === id);
  if (target) {
    await Notifications.cancelScheduledNotificationAsync(target.notificationId);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((r) => r.id !== id)));
}
