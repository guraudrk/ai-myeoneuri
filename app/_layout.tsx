import React from "react";
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
import { View, Text, ScrollView } from "react-native";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync().catch(() => {});

// ── JS 에러 캡처 (렌더 전 모듈 로드 에러 포함) ────────────────
let _capturedError: string | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _errorUtils = (globalThis as any).ErrorUtils;
if (_errorUtils?.setGlobalHandler) {
  _errorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
    _capturedError = `${isFatal ? "FATAL" : "NON-FATAL"}: ${error?.message ?? String(error)}\n${error?.stack ?? ""}`;
    SplashScreen.hideAsync().catch(() => {});
  });
}

// ── React 렌더 에러 캐치 ──────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  componentDidMount() { SplashScreen.hideAsync().catch(() => {}); }
  render() {
    const msg = this.state.error?.toString() ?? _capturedError;
    if (msg) {
      return (
        <View style={{ flex: 1, backgroundColor: "#B22222", padding: 20, paddingTop: 60 }}>
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
            {"JS Error (진단용)"}
          </Text>
          <ScrollView>
            <Text style={{ color: "#FFF", fontSize: 11, lineHeight: 18 }}>{msg}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansKR_700Bold,
    IBMPlexSansKR_600SemiBold,
    NotoSansKR_500Medium,
    NotoSansKR_400Regular,
  });
  void fontsLoaded;

  // 명시적으로 스플래시 숨김 (expo-router 자동 숨김에 의존하지 않음)
  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
    </ErrorBoundary>
  );
}
