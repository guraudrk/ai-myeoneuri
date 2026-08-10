import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabaseClient";

const LINK_KEY = "sl_link_v1";

export type LinkData =
  | { linked: false }
  | { linked: true; elderId: string; elderName: string };

export async function getLinkData(): Promise<LinkData> {
  try {
    const raw = await AsyncStorage.getItem(LINK_KEY);
    if (!raw) return { linked: false };
    return JSON.parse(raw) as LinkData;
  } catch {
    return { linked: false };
  }
}

export async function saveLinkData(data: LinkData): Promise<void> {
  await AsyncStorage.setItem(LINK_KEY, JSON.stringify(data));
}

export async function clearLink(): Promise<void> {
  await supabase.auth.signOut();
  await AsyncStorage.setItem(LINK_KEY, JSON.stringify({ linked: false }));
}
