import { Stack } from "expo-router";
import { Colors } from "@/components/tokens";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navyDeep },
        headerTintColor: Colors.surface,
        headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
