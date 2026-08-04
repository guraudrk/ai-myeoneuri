export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface LocationAdapter {
  getPermissionStatus(): Promise<"granted" | "denied" | "undetermined">;
  requestPermission(): Promise<"granted" | "denied">;
  getCurrentPosition(): Promise<GeoPosition | null>;
}
