import { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Colors, FontSize, TouchSize, Spacing, Shadow, Radius } from "@/components/tokens";
import { LargeMicrophoneButton } from "@/components/LargeMicrophoneButton";
import { ContactCandidateCard } from "@/components/ContactCandidateCard";
import { ConfirmationPanel } from "@/components/ConfirmationPanel";
import { BusinessCandidateCard } from "@/components/BusinessCandidateCard";
import { searchContacts, dialContact } from "@/services/contactCallService";
import { searchBusinesses, dialBusiness } from "@/services/businessCallService";
import { createRealContactsAdapter } from "@/features/contacts/RealContactsAdapter";
import { createRealPhoneAdapter } from "@/features/calling/RealPhoneAdapter";
import { createRealLocationAdapter } from "@/features/location/RealLocationAdapter";
import { createMockBusinessSearchAdapter } from "@/features/business/MockBusinessSearchAdapter";
import { createExpoSpeechAdapter } from "@/features/speech/ExpoSpeechAdapter";
import { detectIntent, extractBusinessQuery } from "@/features/intent/intentParser";
import type { ContactCandidate } from "@/domain/types";
import type { BusinessCandidate } from "@/features/business/BusinessSearchAdapter";

const contactsAdapter = createRealContactsAdapter();
const phoneAdapter = createRealPhoneAdapter();
const locationAdapter = createRealLocationAdapter();
const businessAdapter = createMockBusinessSearchAdapter();

let requestCounter = 0;
function nextRequestId(): string {
  return `req-${++requestCounter}-${Date.now()}`;
}

type ScreenState =
  | { type: "idle" }
  | { type: "searching" }
  | { type: "contact_candidates"; candidates: ContactCandidate[]; requestId: string }
  | { type: "business_candidates"; candidates: BusinessCandidate[]; requestId: string }
  | { type: "confirming_contact"; candidate: ContactCandidate; requestId: string }
  | { type: "confirming_business"; business: BusinessCandidate; requestId: string }
  | { type: "result"; message: string; isError?: boolean }
  | { type: "permission_denied"; reason: "contacts" | "location" }
  | { type: "no_results" };

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [screen, setScreen] = useState<ScreenState>({ type: "idle" });
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const speechAdapter = useMemo(() => createExpoSpeechAdapter(), []);

  async function handleSearch(utterance?: string) {
    const query = (utterance ?? input).trim();
    if (!query) return;

    setScreen({ type: "searching" });
    const intent = detectIntent(query);

    if (intent === "search_business") {
      const businessQuery = extractBusinessQuery(query);
      const result = await searchBusinesses(businessQuery, locationAdapter, businessAdapter);
      if (result.status === "location_denied") {
        setScreen({ type: "permission_denied", reason: "location" });
      } else if (result.status === "no_results") {
        setScreen({ type: "no_results" });
      } else {
        setScreen({ type: "business_candidates", candidates: result.candidates, requestId: nextRequestId() });
      }
    } else {
      const result = await searchContacts(query, contactsAdapter);
      if (result.status === "permission_denied") {
        setScreen({ type: "permission_denied", reason: "contacts" });
      } else if (result.status === "no_results") {
        setScreen({ type: "no_results" });
      } else {
        setScreen({ type: "contact_candidates", candidates: result.candidates, requestId: nextRequestId() });
      }
    }
  }

  async function handleMicPress() {
    if (isListening) {
      await speechAdapter.stopListening();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    await speechAdapter.startListening(
      (text) => {
        setIsListening(false);
        setInput(text);
        handleSearch(text);
      },
      (_err) => setIsListening(false)
    );
  }

  async function handleConfirmContact(candidate: ContactCandidate, requestId: string) {
    const result = await dialContact(requestId, candidate.id, candidate.name, contactsAdapter, phoneAdapter);
    if (result.status === "dialer_opened") {
      setScreen({ type: "result", message: `${result.contactName} 님께 전화 화면을 열었어요.\n통화 버튼을 눌러 주세요.` });
    } else if (result.status === "duplicate_blocked") {
      setScreen({ type: "result", message: "이미 전화 화면을 열었어요." });
    } else {
      setScreen({ type: "result", message: result.status === "phone_not_found" ? "전화번호를 찾을 수 없어요." : (result as { status: "error"; message: string }).message, isError: true });
    }
  }

  async function handleConfirmBusiness(business: BusinessCandidate, requestId: string) {
    const result = await dialBusiness(requestId, business, phoneAdapter);
    if (result.status === "dialer_opened") {
      setScreen({ type: "result", message: `${result.businessName}의 전화 화면을 열었어요.\n통화 버튼을 눌러 주세요.` });
    } else if (result.status === "duplicate_blocked") {
      setScreen({ type: "result", message: "이미 전화 화면을 열었어요." });
    } else {
      setScreen({ type: "result", message: (result as { status: "error"; message: string }).message, isError: true });
    }
  }

  function handleReset() {
    setInput("");
    setIsListening(false);
    speechAdapter.stopListening();
    setScreen({ type: "idle" });
  }

  const isIdle = screen.type === "idle" || screen.type === "no_results" || screen.type === "permission_denied";

  return (
    <View style={styles.root}>

      {/* ── IDLE: 다크 히어로 + 입력 시트 ── */}
      {isIdle && (
        <>
          <View style={styles.hero}>
            <Text style={styles.appBadge}>AI 며느리</Text>
            <Text style={styles.heroTitle}>무엇을{"\n"}도와드릴까요?</Text>
            <LargeMicrophoneButton isListening={isListening} onPress={handleMicPress} />
          </View>

          <ScrollView
            style={styles.inputSheet}
            contentContainerStyle={styles.inputSheetInner}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>직접 입력</Text>
              <View style={styles.orLine} />
            </View>

            <View style={[styles.inputWrapper, Shadow.card]}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="예: 딸한테 전화해 줘 / 근처 병원 찾아줘"
                placeholderTextColor={Colors.placeholder}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch()}
                accessibilityLabel="할 일 입력"
              />
            </View>

            <TouchableOpacity
              style={[styles.runButton, Shadow.button]}
              onPress={() => handleSearch()}
              accessibilityLabel="실행"
            >
              <Text style={styles.runButtonText}>실행하기</Text>
            </TouchableOpacity>

            {screen.type === "no_results" && (
              <View style={styles.statusBox}>
                <Text style={styles.statusEmoji}>🔍</Text>
                <Text style={styles.statusText}>찾을 수 없었어요.{"\n"}다시 말씀해 주세요.</Text>
              </View>
            )}
            {screen.type === "permission_denied" && (
              <View style={[styles.statusBox, styles.statusBoxDanger]}>
                <Text style={styles.statusEmoji}>🔒</Text>
                <Text style={styles.dangerText}>
                  {screen.reason === "contacts"
                    ? "연락처 권한이 없어요.\n설정 → 앱 → AI 며느리 → 권한에서 허용해 주세요."
                    : "위치 권한이 없어요.\n설정 → 앱 → AI 며느리 → 권한에서 허용해 주세요."}
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* ── 검색 중 ── */}
      {screen.type === "searching" && (
        <View style={styles.centerFull}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.searchingText}>찾고 있어요…</Text>
        </View>
      )}

      {/* ── 비(非)아이들 콘텐츠 ── */}
      {(screen.type === "contact_candidates" ||
        screen.type === "business_candidates" ||
        screen.type === "confirming_contact" ||
        screen.type === "confirming_business" ||
        screen.type === "result") && (
        <ScrollView style={styles.contentFull} contentContainerStyle={styles.contentInner}>

          {screen.type === "contact_candidates" && (
            <>
              <Text style={styles.sectionTitle}>누구에게 전화할까요?</Text>
              {screen.candidates.map((c) => (
                <ContactCandidateCard
                  key={c.id}
                  candidate={c}
                  onPress={() => setScreen({ type: "confirming_contact", candidate: c, requestId: screen.requestId })}
                />
              ))}
            </>
          )}

          {screen.type === "business_candidates" && (
            <>
              <Text style={styles.sectionTitle}>어디에 전화할까요?</Text>
              {screen.candidates.map((b) => (
                <BusinessCandidateCard
                  key={b.id}
                  business={b}
                  onPress={() => setScreen({ type: "confirming_business", business: b, requestId: screen.requestId })}
                />
              ))}
            </>
          )}

          {screen.type === "confirming_contact" && (
            <ConfirmationPanel
              candidate={screen.candidate}
              onConfirm={() => handleConfirmContact(screen.candidate, screen.requestId)}
              onCancel={handleReset}
            />
          )}

          {screen.type === "confirming_business" && (
            <View style={[styles.confirmCard, Shadow.card]}>
              <View style={styles.confirmIconBox}>
                <Text style={styles.confirmEmoji}>🏪</Text>
              </View>
              <Text style={styles.confirmName}>{screen.business.name}</Text>
              <Text style={styles.confirmSub}>{screen.business.address}</Text>
              <Text style={styles.confirmQuestion}>지금 전화할까요?</Text>
              <TouchableOpacity
                style={[styles.runButton, Shadow.button]}
                onPress={() => handleConfirmBusiness(screen.business, screen.requestId)}
              >
                <Text style={styles.runButtonEmoji}>📞</Text>
                <Text style={styles.runButtonText}>전화할게요</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
                <Text style={styles.ghostButtonText}>전화하지 않을게요</Text>
              </TouchableOpacity>
            </View>
          )}

          {screen.type === "result" && (
            <View style={[styles.resultCard, Shadow.card, screen.isError && styles.resultCardError]}>
              <Text style={styles.resultEmoji}>
                {screen.isError ? "⚠️" : "✅"}
              </Text>
              <Text style={[styles.resultText, screen.isError && styles.resultTextError]}>
                {screen.message}
              </Text>
              <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
                <Text style={styles.ghostButtonText}>홈으로 돌아가기</Text>
              </TouchableOpacity>
            </View>
          )}

          {(screen.type === "contact_candidates" || screen.type === "business_candidates") && (
            <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
              <Text style={styles.ghostButtonText}>취소할게요</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    backgroundColor: Colors.navyDeep,
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    gap: Spacing.lg,
    flex: 0.55,
    justifyContent: "center",
  },
  appBadge: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 44,
  },
  inputSheet: {
    flex: 0.45,
    backgroundColor: Colors.background,
  },
  inputSheetInner: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
  },
  input: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  runButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    minHeight: TouchSize.minimum,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.xl,
  },
  runButtonEmoji: {
    fontSize: 20,
  },
  runButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.buttonLabel,
    fontWeight: "700",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  statusBoxDanger: {
    backgroundColor: Colors.dangerBg,
  },
  statusEmoji: {
    fontSize: 22,
  },
  statusText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  dangerText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: Colors.danger,
    lineHeight: 24,
  },
  centerFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  searchingText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  contentFull: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.heading,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  confirmIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  confirmEmoji: {
    fontSize: 34,
  },
  confirmName: {
    fontSize: FontSize.headingLarge,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  confirmSub: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    textAlign: "center",
  },
  confirmQuestion: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  resultCardError: {
    backgroundColor: Colors.dangerBg,
  },
  resultEmoji: {
    fontSize: 52,
  },
  resultText: {
    fontSize: FontSize.heading,
    fontWeight: "700",
    color: Colors.successText,
    textAlign: "center",
    lineHeight: 36,
  },
  resultTextError: {
    color: Colors.danger,
  },
  ghostButton: {
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  ghostButtonText: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
