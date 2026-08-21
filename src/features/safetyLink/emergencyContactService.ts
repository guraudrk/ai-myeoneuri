import AsyncStorage from "@react-native-async-storage/async-storage";

export interface EmergencyContact {
  name: string;
  phone: string;
}

const KEY = "emergency_contact_v1";

export async function getEmergencyContact(): Promise<EmergencyContact | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw) as EmergencyContact;
}

export async function setEmergencyContact(contact: EmergencyContact): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(contact));
}
