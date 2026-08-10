import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Colors } from "@/components/tokens";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Spoqa-Regular": require("../assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
    "Spoqa-Medium":  require("../assets/fonts/SpoqaHanSansNeo-Medium.ttf"),
    "Spoqa-Bold":    require("../assets/fonts/SpoqaHanSansNeo-Bold.ttf"),
    "Spoqa-Light":   require("../assets/fonts/SpoqaHanSansNeo-Light.ttf"),
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
