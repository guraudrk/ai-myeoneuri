import AsyncStorage from "@react-native-async-storage/async-storage";

export type FavoriteContact = {
  id: string;
  name: string;
};

const KEY = "ai_myeoneuri_favorites_v1";

export async function getFavorites(): Promise<FavoriteContact[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavoriteContact[]) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(contact: FavoriteContact): Promise<void> {
  const list = await getFavorites();
  if (list.find((f) => f.id === contact.id)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([...list, contact]));
}

export async function removeFavorite(id: string): Promise<void> {
  const list = await getFavorites();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((f) => f.id !== id)));
}
