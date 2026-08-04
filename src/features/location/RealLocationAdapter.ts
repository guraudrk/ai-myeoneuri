import * as Location from "expo-location";
import type { LocationAdapter, GeoPosition } from "./LocationAdapter";

export function createRealLocationAdapter(): LocationAdapter {
  return {
    async getPermissionStatus() {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") return "granted";
      if (status === "denied") return "denied";
      return "undetermined";
    },

    async requestPermission() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted" ? "granted" : "denied";
    },

    async getCurrentPosition(): Promise<GeoPosition | null> {
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        return null;
      }
    },
  };
}
