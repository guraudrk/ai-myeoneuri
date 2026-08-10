import { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Colors } from "@/components/tokens";
import { supabase } from "@/features/supabase/supabaseClient";
import { OnboardingScreen, ONBOARDING_KEY } from "@/features/onboarding/OnboardingScreen";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansKR_700Bold,
    IBMPlexSansKR_600SemiBold,
    NotoSansKR_500Medium,
    NotoSansKR_400Regular,
  });
  void fontsLoaded;

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding]       = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(!val);
      setOnboardingChecked(true);
    });
  }, []);

  // 구글 OAuth 딥링크 수신 → code 교환 → onAuthStateChange가 OnboardingScreen에 전달
  useEffect(() => {
    const sub = Linking.addEventListener("url", async ({ url }) => {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (!code) return;
      await supabase.auth.exchangeCodeForSession(code);
    });
    return () => sub.remove();
  }, []);

  if (!onboardingChecked) return null;

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
