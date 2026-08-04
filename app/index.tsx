import { useState } from "react";
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
import { searchContacts, dialContact } from "@/services/contactCallService";
import { createMockContactsAdapter } from "@/features/contacts/MockContactsAdapter";
import { createMockPhoneAdapter } from "@/features/calling/MockPhoneAdapter";
import type { ContactCandidate } from "@/domain/types";

// Mock 모드: 실제 기기 연동 전까지 사용
const contactsAdapter = createMockContactsAdapter();
const phoneAdapter = createMockPhoneAdapter();

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

  async function handleSearch() {
    if (!input.trim()) return;
    setScreen({ type: "searching" });

    const result = await searchContacts(input, contactsAdapter);
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

  async function handleDial(candidate: ContactCandidate, requestId: string) {
    setScreen({ type: "confirming", candidate, requestId });
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
      setScreen({
        type: "result",
        message: "이미 전화 화면을 열었어요.",
        isError: false,
      });
    } else {
      setScreen({
        type: "result",
        message: result.status === "phone_not_found"
          ? "전화번호를 찾을 수 없어요."
          : (result as { status: "error"; message: string }).message,
        isError: true,
      });
    }
  }

  function handleReset() {
    setInput("");
    setScreen({ type: "idle" });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 홈 / 검색 영역 */}
      {(screen.type === "idle" || screen.type === "no_results" || screen.type === "permission_denied") && (
        <View style={styles.section}>
          <Text style={styles.heading}>무엇을 도와드릴까요?</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="예: 딸한테 전화해 줘"
            placeholderTextColor={Colors.placeholder}
            multiline={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            accessibilityLabel="할 일 입력"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSearch}
            accessibilityLabel="검색"
          >
            <Text style={styles.primaryButtonText}>실행하기</Text>
          </TouchableOpacity>

          {screen.type === "no_results" && (
            <Text style={styles.infoText}>연락처에서 찾을 수 없었어요.</Text>
          )}
          {screen.type === "permission_denied" && (
            <Text style={styles.dangerText}>
              연락처 사용이 허용되지 않았어요.{"\n"}
              글자로 번호를 직접 입력하거나 설정에서 허용할 수 있어요.
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
            <TouchableOpacity
              key={c.id}
              style={styles.candidateCard}
              onPress={() => handleDial(c, screen.requestId)}
              accessibilityLabel={`${c.name}에게 전화`}
            >
              <Text style={styles.candidateName}>{c.name}</Text>
              <Text style={styles.candidateNumber}>{c.maskedNumber}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={handleReset}>
            <Text style={styles.cancelButtonText}>취소할게요</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 최종 확인 */}
      {screen.type === "confirming" && (
        <View style={styles.section}>
          <Text style={styles.heading}>
            {screen.candidate.name} 님에게{"\n"}지금 전화할까요?
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleConfirm(screen.candidate, screen.requestId)}
            accessibilityLabel="전화 확인"
          >
            <Text style={styles.primaryButtonText}>전화할게요</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleReset}>
            <Text style={styles.cancelButtonText}>전화하지 않을게요</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 결과 */}
      {screen.type === "result" && (
        <View style={styles.section}>
          <Text style={screen.isError ? styles.dangerText : styles.successText}>
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
    gap: Spacing.md,
  },
  heading: {
    fontSize: FontSize.heading,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 36,
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
  candidateCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: 12,
    padding: Spacing.md,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
  },
  candidateName: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  candidateNumber: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
  infoText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  successText: {
    fontSize: FontSize.heading,
    color: Colors.successText,
    fontWeight: "700",
    lineHeight: 36,
    textAlign: "center",
  },
  dangerText: {
    fontSize: FontSize.body,
    color: Colors.danger,
    textAlign: "center",
    lineHeight: 30,
  },
});
