import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Colors } from "@/components/tokens";
import { RevenueCatService } from "@/features/billing/RevenueCatService";

RevenueCatService.configure();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Pretendard-Bold":     require("../assets/fonts/Pretendard-Bold.ttf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.ttf"),
    "Pretendard-Medium":   require("../assets/fonts/Pretendard-Medium.ttf"),
    "Pretendard-Regular":  require("../assets/fonts/Pretendard-Regular.ttf"),
  });
  if (!fontsLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
