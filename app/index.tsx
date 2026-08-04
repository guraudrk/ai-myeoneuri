import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Colors, FontSize, TouchSize, Spacing } from "@/components/tokens";
import { LargeMicrophoneButton } from "@/components/LargeMicrophoneButton";
import { ContactCandidateCard } from "@/components/ContactCandidateCard";
import { ConfirmationPanel } from "@/components/ConfirmationPanel";
import { searchContacts, dialContact } from "@/services/contactCallService";
import { createRealContactsAdapter } from "@/features/contacts/RealContactsAdapter";
import { createRealPhoneAdapter } from "@/features/calling/RealPhoneAdapter";
import { createMockSpeechAdapter } from "@/features/speech/MockSpeechAdapter";
import type { ContactCandidate } from "@/domain/types";

const contactsAdapter = createRealContactsAdapter();
const phoneAdapter = createRealPhoneAdapter();
const speechAdapter = createMockSpeechAdapter();

let requestCounter = 0;
function nextRequestId(): string {
  return `req-${++requestCounter}-${Date.now()}`;
}

type ScreenState =
  | { type: "idle" }
  | { type: "searching" }
  | { type: "candidates"; candidates: ContactCandidate[]; requestId: string }
  | { type: "confirming"; candidate: ContactCandidate; requestId: string }
  | { type: "result"; message: string; isError?: boolean }
  | { type: "permission_denied" }
  | { type: "no_results" };

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [screen, setScreen] = useState<ScreenState>({ type: "idle" });
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function handleSearch(utterance?: string) {
    const query = (utterance ?? input).trim();
    if (!query) return;
    setScreen({ type: "searching" });

    const result = await searchContacts(query, contactsAdapter);
    if (result.status === "permission_denied") {
      setScreen({ type: "permission_denied" });
    } else if (result.status === "no_results") {
      setScreen({ type: "no_results" });
    } else {
      setScreen({
        type: "candidates",
        candidates: result.candidates,
        requestId: nextRequestId(),
      });
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
      (_err) => {
        setIsListening(false);
      }
    );
  }

  async function handleConfirm(candidate: ContactCandidate, requestId: string) {
    const result = await dialContact(
      requestId,
      candidate.id,
      candidate.name,
      contactsAdapter,
      phoneAdapter
    );

    if (result.status === "dialer_opened") {
      setScreen({
        type: "result",
        message: `${result.contactName} 님의 전화 화면을 열었어요.\n통화 버튼을 눌러 주세요.`,
      });
    } else if (result.status === "duplicate_blocked") {
      setScreen({ type: "result", message: "이미 전화 화면을 열었어요." });
    } else {
      setScreen({
        type: "result",
        message:
          result.status === "phone_not_found"
            ? "전화번호를 찾을 수 없어요."
            : (result as { status: "error"; message: string }).message,
        isError: true,
      });
    }
  }

  function handleReset() {
    setInput("");
    setIsListening(false);
    speechAdapter.stopListening();
    setScreen({ type: "idle" });
  }

  const showIdle =
    screen.type === "idle" ||
    screen.type === "no_results" ||
    screen.type === "permission_denied";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 홈 */}
      {showIdle && (
        <View style={styles.section}>
          <Text style={styles.heading}>무엇을 도와드릴까요?</Text>

          {/* 마이크 버튼 — 주 입력 */}
          <LargeMicrophoneButton
            isListening={isListening}
            onPress={handleMicPress}
          />

          <Text style={styles.divider}>— 또는 직접 입력 —</Text>

          {/* 텍스트 입력 — 보조 입력 */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="예: 딸한테 전화해 줘"
            placeholderTextColor={Colors.placeholder}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
            accessibilityLabel="할 일 입력"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleSearch()}
            accessibilityLabel="검색"
          >
            <Text style={styles.primaryButtonText}>실행하기</Text>
          </TouchableOpacity>

          {screen.type === "no_results" && (
            <Text style={styles.infoText}>
              연락처에서 찾을 수 없었어요.{"\n"}이름을 다시 말해보세요.
            </Text>
          )}
          {screen.type === "permission_denied" && (
            <Text style={styles.dangerText}>
              연락처 사용이 허용되지 않았어요.{"\n"}
              설정 → 앱 → AI 며느리 → 권한에서 허용해 주세요.
            </Text>
          )}
        </View>
      )}

      {/* 검색 중 */}
      {screen.type === "searching" && (
        <View style={styles.section}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.infoText}>연락처에서 찾고 있어요…</Text>
        </View>
      )}

      {/* 후보 목록 */}
      {screen.type === "candidates" && (
        <View style={styles.section}>
          <Text style={styles.heading}>누구에게 전화할까요?</Text>
          {screen.candidates.map((c) => (
            <ContactCandidateCard
              key={c.id}
              candidate={c}
              onPress={() =>
                setScreen({
                  type: "confirming",
                  candidate: c,
                  requestId: screen.requestId,
                })
              }
            />
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={handleReset}>
            <Text style={styles.cancelButtonText}>취소할게요</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 최종 확인 */}
      {screen.type === "confirming" && (
        <View style={styles.section}>
          <ConfirmationPanel
            candidate={screen.candidate}
            onConfirm={() => handleConfirm(screen.candidate, screen.requestId)}
            onCancel={handleReset}
          />
        </View>
      )}

      {/* 결과 */}
      {screen.type === "result" && (
        <View style={styles.section}>
          <Text
            style={screen.isError ? styles.dangerText : styles.successText}
          >
            {screen.message}
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleReset}>
            <Text style={styles.cancelButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    justifyContent: "center",
  },
  section: {
    gap: Spacing.lg,
  },
  heading: {
    fontSize: FontSize.headingLarge,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 40,
    textAlign: "center",
  },
  divider: {
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: FontSize.caption,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: TouchSize.minimum,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: FontSize.buttonLabel,
    fontWeight: "700",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.buttonLabel,
    fontWeight: "600",
  },
  infoText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 30,
  },
  successText: {
    fontSize: FontSize.headingLarge,
    color: Colors.successText,
    fontWeight: "700",
    lineHeight: 40,
    textAlign: "center",
  },
  dangerText: {
    fontSize: FontSize.body,
    color: Colors.danger,
    textAlign: "center",
    lineHeight: 30,
  },
});
