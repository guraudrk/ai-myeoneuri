import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "relationship_map_v2";

type RelationshipMap = Record<string, string>; // relationship → contactId

async function load(): Promise<RelationshipMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RelationshipMap) : {};
  } catch {
    return {};
  }
}

export async function getMapping(relationship: string): Promise<string | null> {
  const map = await load();
  return map[relationship] ?? null;
}

export async function saveMapping(relationship: string, contactId: string): Promise<void> {
  const map = await load();
  map[relationship] = contactId;
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}
