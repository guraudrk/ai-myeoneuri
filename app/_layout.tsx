import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  IBMPlexSansKR_600SemiBold,
  IBMPlexSansKR_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-kr";
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
} from "@expo-google-fonts/noto-sans-kr";
import { Colors } from "@/components/tokens";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansKR_700Bold,
    IBMPlexSansKR_600SemiBold,
    NotoSansKR_500Medium,
    NotoSansKR_400Regular,
  });

  // 폰트 로딩 전에도 레이아웃은 정상 렌더 (시스템 기본 폰트로 fallback)
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
