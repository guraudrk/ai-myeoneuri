import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
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
import { Colors } from "@/components/tokens";
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

  // Stack은 항상 마운트 — 온보딩은 그 위에 오버레이로 표시.
  // 이렇게 해야 onDone() 시 Stack이 즉시 드러난다.
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      {onboardingChecked && showOnboarding && (
        <View style={StyleSheet.absoluteFillObject}>
          <OnboardingScreen onDone={() => setShowOnboarding(false)} />
        </View>
      )}
    </>
  );
}
