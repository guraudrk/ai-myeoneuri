import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Colors } from "@/components/tokens";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Pretendard-Regular":  require("../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Medium":   require("../assets/fonts/Pretendard-Medium.ttf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.ttf"),
    "Pretendard-Bold":     require("../assets/fonts/Pretendard-Bold.ttf"),
  });
  void fontsLoaded;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
