import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { supabase } from "../supabase/supabaseClient";
import {
  AnalyticsEventMap,
  AnalyticsEventName,
  QueuedEvent,
} from "./analyticsTypes";

const QUEUE_KEY = "@silverlink/analytics_queue";
const DEVICE_ID_KEY = "@silverlink/device_id";
const MAX_QUEUE = 200;
const BATCH_SIZE = 50;

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "unknown";
}

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function generateId(): string {
  // crypto.getRandomValues polyfill via react-native-get-random-values
  // Falls back to Math.random if polyfill not present
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    arr[6] = (arr[6] & 0x0f) | 0x40;
    arr[8] = (arr[8] & 0x3f) | 0x80;
    return [...arr]
      .map((b, i) =>
        [4, 6, 8, 10].includes(i)
          ? "-" + b.toString(16).padStart(2, "0")
          : b.toString(16).padStart(2, "0")
      )
      .join("");
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function loadQueue(): Promise<QueuedEvent[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedEvent[];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedEvent[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Record an analytics event — appended to the offline queue.
 * The queue is flushed to Supabase on app_open.
 * PII contract: caller must never pass phone numbers, real names, or message text.
 */
async function track<K extends AnalyticsEventName>(
  name: K,
  props: AnalyticsEventMap[K]
): Promise<void> {
  const [deviceId, userId] = await Promise.all([getDeviceId(), getUserId()]);
  const event: QueuedEvent = {
    id: generateId(),
    name,
    props,
    device_id: deviceId,
    user_id: userId,
    ts: new Date().toISOString(),
    app_version: getAppVersion(),
  };

  const queue = await loadQueue();
  queue.push(event);

  // Drop oldest when queue is full
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);

  await saveQueue(queue);
}

/**
 * Flush queued events to Supabase in batches.
 * Called on app_open. Silent on network failure (events stay queued).
 */
async function flush(): Promise<void> {
  const queue = await loadQueue();
  if (queue.length === 0) return;

  const batches: QueuedEvent[][] = [];
  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    batches.push(queue.slice(i, i + BATCH_SIZE));
  }

  const successIds = new Set<string>();

  for (const batch of batches) {
    const rows = batch.map((e) => ({
      id: e.id,
      name: e.name,
      props: e.props,
      device_id: e.device_id,
      user_id: e.user_id,
      ts: e.ts,
      app_version: e.app_version,
    }));

    const { error } = await supabase.from("events").upsert(rows, {
      onConflict: "id",
      ignoreDuplicates: true,
    });

    if (!error) {
      batch.forEach((e) => successIds.add(e.id));
    }
  }

  if (successIds.size > 0) {
    const remaining = queue.filter((e) => !successIds.has(e.id));
    await saveQueue(remaining);
  }
}

export const AnalyticsService = { track, flush };
