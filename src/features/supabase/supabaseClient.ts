import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (__DEV__) {
  if (!url) {
    console.error("[SilverLink 연결] EXPO_PUBLIC_SUPABASE_URL이 비어 있습니다. .env 파일을 확인하세요.");
  } else if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    console.error(`[SilverLink 연결] EXPO_PUBLIC_SUPABASE_URL 형식이 잘못됐습니다: ${url.slice(0, 40)}`);
  }
  if (!key) {
    console.error("[SilverLink 연결] EXPO_PUBLIC_SUPABASE_ANON_KEY가 비어 있습니다. .env 파일을 확인하세요.");
  } else if (!key.startsWith("eyJ") || key.length < 150) {
    console.error(
      `[SilverLink 연결] EXPO_PUBLIC_SUPABASE_ANON_KEY가 ${key.length}자입니다.\n` +
      "정상 키는 150자 이상의 JWT(eyJ...)입니다. .env 값이 잘렸는지 확인하세요."
    );
  }
}

// 세션을 AsyncStorage에 자동 저장·갱신 — 앱 재시작 시 로그인 유지
export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
