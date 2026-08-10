import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  SafeAreaView, StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Colors, FontFamily, FontSize, TouchSize, Spacing, Radius, Shadow } from "@/components/tokens";
import { supabase } from "@/features/supabase/supabaseClient";
import { saveLinkData } from "@/features/supabase/linkService";

WebBrowser.maybeCompleteAuthSession();

export const ONBOARDING_KEY = "onboarding_v1";

type Step = "welcome" | "login" | "select";

interface ParentProfileRow {
  id: string;
  display_name: string;
}

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const [step, setStep]         = useState<Step>("welcome");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [elders, setElders]     = useState<ParentProfileRow[]>([]);

  async function finish(linked: boolean, elderId?: string, elderName?: string) {
    await saveLinkData(
      linked && elderId && elderName
        ? { linked: true, elderId, elderName }
        : { linked: false }
    );
    await AsyncStorage.setItem(ONBOARDING_KEY, "done");
    onDone();
  }

  async function afterLogin(): Promise<boolean> {
    const { data: profiles, error: profileErr } = await supabase
      .from("parent_profiles")
      .select("id, display_name")
      .order("created_at", { ascending: false });

    if (profileErr) {
      setError("어르신 목록을 불러오지 못했어요. 다시 시도해 주세요.");
      await supabase.auth.signOut();
      return false;
    }
    if (!profiles || profiles.length === 0) {
      setError("SilverLink에 등록된 어르신이 없어요.\nSilverLink 앱에서 먼저 등록해 주세요.");
      await supabase.auth.signOut();
      return false;
    }
    setElders(profiles as ParentProfileRow[]);
    setStep("select");
    return true;
  }

  async function handleLogin() {
    setError("");
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authErr || !data.user) {
        setError("이메일 또는 비밀번호를 확인해 주세요.");
        return;
      }
      await afterLogin();
    } catch {
      setError("인터넷 연결을 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  // _layout.tsx 대신 여기서 직접 code 교환 → 에러를 UI에 바로 표시할 수 있음
  async function handleOAuthUrl(url: string) {
    const parsed = Linking.parse(url);
    const code = parsed.queryParams?.code as string | undefined;
    if (!code) return;
    setLoading(true);
    const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exchErr) {
      setError(`구글 로그인 처리 오류: ${exchErr.message}`);
      setLoading(false);
    }
    // 성공 시 onAuthStateChange(SIGNED_IN)이 아래 useEffect에서 감지
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      const redirectTo = Linking.createURL("auth-callback");
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthErr || !data.url) {
        setError("구글 로그인을 시작할 수 없어요.");
        return;
      }
      await WebBrowser.openBrowserAsync(data.url);
    } catch {
      setError("인터넷 연결을 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  // 딥링크 수신 → code 교환 (앱이 이미 실행 중인 경우)
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => { void handleOAuthUrl(url); });
    return () => sub.remove();
  }, []);

  // 앱이 딥링크로 cold-start된 경우 initial URL에서 code 추출
  useEffect(() => {
    Linking.getInitialURL().then((url) => { if (url) void handleOAuthUrl(url); });
  }, []);

  // code 교환 성공 후 세션 감지 → select 단계로 이동
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setLoading(true);
          await afterLogin();
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── 환영 ──────────────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <View style={s.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <SafeAreaView style={s.safeArea}>
          <View style={s.welcomeBody}>
            <Text style={s.appBadge}>AI 며느리</Text>
            <Text style={s.welcomeTitle}>{"환영해요 👋"}</Text>
            <Text style={s.welcomeDesc}>
              {"가족이 SilverLink를 사용 중이시면\n연결해 두시면 이상 상황을\n바로 가족에게 알릴 수 있어요."}
            </Text>
          </View>
          <View style={s.btnGroup}>
            <TouchableOpacity
              style={[s.primaryBtn, Shadow.button]}
              onPress={() => setStep("login")}
            >
              <Text style={s.primaryBtnText}>SilverLink 연결하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => finish(false)}>
              <Text style={s.ghostBtnText}>지금은 괜찮아요</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── 로그인 ────────────────────────────────────────────────────────────────
  if (step === "login") {
    return (
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <SafeAreaView style={s.safeArea}>
          <ScrollView
            contentContainerStyle={s.loginBody}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => { setError(""); setStep("welcome"); }}
            >
              <Text style={s.backBtnText}>← 뒤로</Text>
            </TouchableOpacity>

            <Text style={s.loginTitle}>{"SilverLink 계정으로\n로그인해 주세요"}</Text>
            <Text style={s.loginSub}>보호자(자녀) 계정으로 로그인하세요</Text>

            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              placeholderTextColor={Colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호"
              placeholderTextColor={Colors.placeholder}
              secureTextEntry
            />

            <TouchableOpacity
              style={[s.primaryBtn, Shadow.button, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.primaryBtnText}>로그인</Text>}
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>또는</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={[s.googleBtn, loading && s.btnDisabled]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Text style={s.googleBtnText}>🔵  구글로 계속하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // ── 어르신 선택 ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={s.safeArea}>
        <ScrollView contentContainerStyle={s.selectBody}>
          <Text style={s.selectTitle}>{"어르신을\n선택해 주세요"}</Text>

          {elders.map((elder) => (
            <TouchableOpacity
              key={elder.id}
              style={[s.elderCard, Shadow.card]}
              onPress={() => finish(true, elder.id, elder.display_name)}
              activeOpacity={0.75}
            >
              <View style={s.elderAvatar}>
                <Text style={s.elderAvatarText}>
                  {elder.display_name?.[0] ?? "?"}
                </Text>
              </View>
              <Text style={s.elderName}>{elder.display_name}</Text>
              <Text style={s.elderChevron}>›</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={s.ghostBtn} onPress={() => finish(false)}>
            <Text style={s.ghostBtnText}>취소</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.xl },

  // ── 환영 ──
  welcomeBody: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  appBadge: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 54,
    fontFamily: FontFamily.heading,
  },
  welcomeDesc: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    lineHeight: 32,
  },

  // ── 로그인 ──
  loginBody: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  backBtn:     { paddingVertical: Spacing.sm, alignSelf: "flex-start" },
  backBtnText: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: "600" },
  loginTitle: {
    fontSize: FontSize.heading,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 36,
    fontFamily: FontFamily.heading,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  loginSub: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
    height: TouchSize.minimum + 4,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  errorBox: {
    backgroundColor: "#FEF3F2",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#FECDCA",
  },
  errorText: {
    fontSize: FontSize.caption,
    color: Colors.danger,
    lineHeight: 22,
  },

  // ── 어르신 선택 ──
  selectBody: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  selectTitle: {
    fontSize: FontSize.headingLarge,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 46,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.md,
  },
  elderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  elderAvatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  elderName:    { flex: 1, fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary },
  elderChevron: { fontSize: 24, color: Colors.textMuted },

  // ── 공용 ──
  btnGroup: {
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    width: "100%",
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: FontSize.buttonLabel,
    fontWeight: "700",
  },
  btnDisabled: { opacity: 0.6 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  googleBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleBtnText: {
    fontSize: FontSize.buttonLabel,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  ghostBtn: {
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
  },
  ghostBtnText: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
