import { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  BackHandler,
  StatusBar,
  Animated,
} from "react-native";
import { Stack } from "expo-router";
import { Colors, FontFamily, FontSize, TouchSize, Spacing, Shadow, Radius } from "@/components/tokens";
import type { AppCandidate } from "@/features/intent/intentParser";
import { LargeMicrophoneButton } from "@/components/LargeMicrophoneButton";
import { ContactCandidateCard } from "@/components/ContactCandidateCard";
import { ConfirmationPanel } from "@/components/ConfirmationPanel";
import { BusinessCandidateCard } from "@/components/BusinessCandidateCard";
import { searchContacts, dialContact } from "@/services/contactCallService";
import { searchBusinesses, dialBusiness } from "@/services/businessCallService";
import { createRealContactsAdapter } from "@/features/contacts/RealContactsAdapter";
import { createRealPhoneAdapter } from "@/features/calling/RealPhoneAdapter";
import { createRealLocationAdapter } from "@/features/location/RealLocationAdapter";
import { createKakaoBusinessSearchAdapter } from "@/features/business/KakaoBusinessSearchAdapter";
import { createExpoSpeechAdapter } from "@/features/speech/ExpoSpeechAdapter";
import { parseIntent, askGemini, openAppByName } from "@/features/intent/intentParser";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  type FavoriteContact,
} from "@/features/favorites/FavoritesAdapter";
import {
  getReminders,
  addReminder,
  removeReminder,
  setupNotificationChannel,
  requestNotificationPermission,
  type Reminder,
} from "@/features/reminders/ReminderService";
import type { ContactCandidate } from "@/domain/types";
import type { BusinessCandidate } from "@/features/business/BusinessSearchAdapter";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **굵게** → 굵게
    .replace(/\*(.+?)\*/g, "$1")        // *기울임* → 기울임
    .replace(/^#{1,6}\s+/gm, "")        // ## 제목 → 제목
    .replace(/`{1,3}[^`]*`{1,3}/g, "")  // `코드` 제거
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // [링크텍스트](url) → 링크텍스트
    .replace(/^\s*[-*]\s+/gm, "• ")     // - 목록 → • 목록
    .trim();
}

const contactsAdapter = createRealContactsAdapter();
const phoneAdapter = createRealPhoneAdapter();
const locationAdapter = createRealLocationAdapter();
const businessAdapter = createKakaoBusinessSearchAdapter();

let requestCounter = 0;
function nextRequestId(): string {
  return `req-${++requestCounter}-${Date.now()}`;
}

type ScreenState =
  | { type: "idle" }
  | { type: "searching" }
  | { type: "contact_candidates"; candidates: ContactCandidate[]; requestId: string }
  | { type: "business_candidates"; candidates: BusinessCandidate[]; requestId: string; query: string }
  | { type: "confirming_contact"; candidate: ContactCandidate; requestId: string }
  | { type: "confirming_business"; business: BusinessCandidate; requestId: string }
  | { type: "result"; message: string; isError?: boolean }
  | { type: "general_answer"; question: string; answer: string }
  | { type: "safety_alert"; category: string; utterance: string }
  | { type: "app_candidates"; candidates: AppCandidate[]; appFamily: string }
  | { type: "permission_denied"; reason: "contacts" | "location" }
  | { type: "no_results" };

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [screen, setScreen] = useState<ScreenState>({ type: "idle" });
  const [isListening, setIsListening] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteContact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMedicine, setReminderMedicine] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const inputRef = useRef<TextInput>(null);
  const speechAdapter = useMemo(() => createExpoSpeechAdapter(), []);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setupNotificationChannel().catch(() => {});
    loadFavorites();
    loadReminders();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen.type !== "idle") {
        handleReset();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen.type]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [screen.type]);

  async function loadFavorites() {
    setFavorites(await getFavorites());
  }
  async function loadReminders() {
    setReminders(await getReminders());
  }

  async function handleSearch(utterance?: string) {
    const query = (utterance ?? input).trim();
    if (!query) return;
    setScreen({ type: "searching" });

    const parsed = await parseIntent(query);

    if (parsed.intent === "sos") {
      setScreen({ type: "idle" });
      handleSOS();
      return;
    }

    if (parsed.intent === "set_reminder") {
      setScreen({ type: "idle" });
      if (parsed.medicineName) setReminderMedicine(parsed.medicineName);
      if (parsed.timeHHMM) setReminderTime(parsed.timeHHMM);
      setShowReminderModal(true);
      return;
    }

    if (parsed.intent === "open_app") {
      const result = await openAppByName(parsed.appName, parsed.packageName);
      if (result.status === "opened") {
        setScreen({ type: "idle" });
      } else if (result.status === "ambiguous") {
        setScreen({ type: "app_candidates", candidates: result.candidates, appFamily: parsed.appName });
      } else {
        Alert.alert(
          "앱을 찾을 수 없어요",
          `"${parsed.appName}" 앱이 설치되어 있지 않아요.\n앱 스토어에서 설치해 주세요.`,
          [{ text: "확인", style: "default" }]
        );
        setScreen({ type: "idle" });
      }
      return;
    }

    if (parsed.intent === "safety_concern") {
      setScreen({ type: "safety_alert", category: parsed.category, utterance: parsed.utterance });
      return;
    }

    if (parsed.intent === "general_question") {
      // 2차 호출 — 분류 프롬프트 없이 질문 원문을 Gemini에게 그대로 던진다
      const answer = await askGemini(parsed.utterance);
      setScreen({ type: "general_answer", question: parsed.utterance, answer });
      return;
    }

    if (parsed.intent === "search_business") {
      const result = await searchBusinesses(parsed.query, locationAdapter, businessAdapter);
      if (result.status === "location_denied") {
        setScreen({ type: "permission_denied", reason: "location" });
      } else if (result.status === "search_error") {
        Alert.alert("검색 오류 (디버그)", result.reason);
        setScreen({ type: "no_results" });
      } else if (result.status === "no_results") {
        setScreen({ type: "no_results" });
      } else {
        setScreen({ type: "business_candidates", candidates: result.candidates, requestId: nextRequestId(), query: parsed.query });
      }
      return;
    }

    if (parsed.intent === "call_contact") {
      const searchQuery = parsed.contactName || query;
      const result = await searchContacts(searchQuery, contactsAdapter);
      if (result.status === "permission_denied") {
        setScreen({ type: "permission_denied", reason: "contacts" });
      } else if (result.status === "no_results") {
        setScreen({ type: "no_results" });
      } else {
        setScreen({ type: "contact_candidates", candidates: result.candidates, requestId: nextRequestId() });
      }
      return;
    }

    // unknown — 연락처로 검색 시도
    const result = await searchContacts(query, contactsAdapter);
    if (result.status === "permission_denied") {
      setScreen({ type: "permission_denied", reason: "contacts" });
    } else if (result.status === "no_results") {
      setScreen({ type: "no_results" });
    } else {
      setScreen({ type: "contact_candidates", candidates: result.candidates, requestId: nextRequestId() });
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
      (err) => {
        setIsListening(false);
        Alert.alert("음성 인식 오류", err);
      }
    );
  }

  function handleSOS() {
    Alert.alert(
      "🆘 긴급 전화",
      "119에 전화하시겠어요?",
      [
        { text: "취소", style: "cancel" },
        { text: "119 전화", style: "destructive", onPress: () => Linking.openURL("tel:119") },
      ]
    );
  }

  async function handleConfirmContact(candidate: ContactCandidate, requestId: string) {
    const result = await dialContact(requestId, candidate.id, candidate.name, contactsAdapter, phoneAdapter);
    if (result.status === "dialer_opened") {
      setScreen({ type: "result", message: `${result.contactName} 님께 전화 화면을 열었어요.\n통화 버튼을 눌러 주세요.` });
    } else if (result.status === "duplicate_blocked") {
      setScreen({ type: "result", message: "이미 전화 화면을 열었어요." });
    } else {
      setScreen({
        type: "result",
        message: result.status === "phone_not_found" ? "전화번호를 찾을 수 없어요." : (result as { status: "error"; message: string }).message,
        isError: true,
      });
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

  async function handleAddFavorite(candidate: ContactCandidate) {
    await addFavorite({ id: candidate.id, name: candidate.name });
    setFavorites(await getFavorites());
    Alert.alert("즐겨찾기 추가", `${candidate.name} 님을 즐겨찾기에 추가했어요.`);
  }

  async function handleFavoriteDial(fav: FavoriteContact) {
    const reqId = nextRequestId();
    const result = await dialContact(reqId, fav.id, fav.name, contactsAdapter, phoneAdapter);
    if (result.status === "dialer_opened") {
      setScreen({ type: "result", message: `${result.contactName} 님께 전화 화면을 열었어요.\n통화 버튼을 눌러 주세요.` });
    } else {
      Alert.alert("전화 오류", result.status === "phone_not_found" ? "전화번호를 찾을 수 없어요." : "전화 연결에 실패했어요.");
    }
  }

  async function handleRemoveFavorite(id: string) {
    await removeFavorite(id);
    setFavorites(await getFavorites());
  }

  async function handleSaveReminder() {
    if (!reminderMedicine.trim()) {
      Alert.alert("약 이름을 입력해 주세요");
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert("알림 권한이 없어요", "설정 → AI 며느리 → 알림을 허용해 주세요.");
      return;
    }
    await addReminder(reminderMedicine.trim(), reminderTime);
    setReminders(await getReminders());
    setShowReminderModal(false);
    setReminderMedicine("");
    setReminderTime("08:00");
    Alert.alert("알림 설정 완료", `매일 ${reminderTime}에 ${reminderMedicine} 복용 알림이 울려요.`);
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
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── 약 알림 추가 모달 ── */}
      <Modal visible={showReminderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.card]}>
            <Text style={styles.modalTitle}>💊 약 복용 알림 설정</Text>
            <TextInput
              style={styles.modalInput}
              value={reminderMedicine}
              onChangeText={setReminderMedicine}
              placeholder="약 이름 (예: 혈압약)"
              placeholderTextColor={Colors.placeholder}
            />
            <TextInput
              style={styles.modalInput}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="시간 (예: 08:00)"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity style={[styles.runButton, Shadow.button]} onPress={handleSaveReminder}>
              <Text style={styles.runButtonText}>매일 알림 설정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostButton} onPress={() => setShowReminderModal(false)}>
              <Text style={styles.ghostButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── IDLE ── */}
      {isIdle && (
        <>
          <View style={styles.hero}>
            <Text style={styles.appBadge}>AI 며느리</Text>
            <Text style={styles.heroTitle}>무엇을{"\n"}도와드릴까요?</Text>
            <LargeMicrophoneButton isListening={isListening} onPress={handleMicPress} />
            <TouchableOpacity style={styles.sosButton} onPress={handleSOS} accessibilityLabel="긴급 SOS">
              <Text style={styles.sosText}>🆘  긴급 SOS</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.inputSheet} contentContainerStyle={styles.inputSheetInner} keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHandle} />

            {/* 즐겨찾기 */}
            {favorites.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>즐겨찾기</Text>
                {favorites.map((fav) => (
                  <View key={fav.id} style={[styles.favRow, Shadow.card]}>
                    <TouchableOpacity
                      style={styles.favMain}
                      onPress={() => handleFavoriteDial(fav)}
                      accessibilityLabel={`${fav.name} 전화`}
                    >
                      <Text style={styles.favName}>{fav.name}</Text>
                      <Text style={styles.favPhone}>탭하면 전화 연결</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.favDelete} onPress={() => handleRemoveFavorite(fav.id)}>
                      <Text style={styles.favDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* 약 알림 목록 */}
            {reminders.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>약 복용 알림</Text>
                {reminders.map((r) => (
                  <View key={r.id} style={[styles.reminderRow, Shadow.card]}>
                    <View style={styles.reminderMain}>
                      <Text style={styles.reminderName}>{r.medicineName}</Text>
                      <Text style={styles.reminderTime}>매일 {r.timeHHMM}</Text>
                    </View>
                    <TouchableOpacity style={styles.favDelete} onPress={() => {
                      removeReminder(r.id).then(() => loadReminders());
                    }}>
                      <Text style={styles.favDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* 직접 입력 */}
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

            <TouchableOpacity style={[styles.runButton, Shadow.button]} onPress={() => handleSearch()} accessibilityLabel="실행">
              <Text style={styles.runButtonText}>실행하기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addReminderButton} onPress={() => setShowReminderModal(true)}>
              <Text style={styles.addReminderText}>+ 약 복용 알림 추가</Text>
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

      {/* ── 결과 화면 ── */}
      {(screen.type === "contact_candidates" ||
        screen.type === "business_candidates" ||
        screen.type === "confirming_contact" ||
        screen.type === "confirming_business" ||
        screen.type === "general_answer" ||
        screen.type === "safety_alert" ||
        screen.type === "app_candidates" ||
        screen.type === "result") && (
        <ScrollView style={styles.contentFull} contentContainerStyle={styles.contentInner}>
          <Animated.View style={{ opacity: fadeAnim, gap: Spacing.md }}>

          {screen.type === "app_candidates" && (
            <>
              <Text style={styles.sectionTitle}>어떤 앱을 여실까요?</Text>
              {screen.candidates.map((c) => (
                <TouchableOpacity
                  key={c.packageName}
                  style={[styles.appCandidateRow, Shadow.card]}
                  onPress={async () => {
                    const r = await openAppByName(c.name, c.packageName);
                    if (r.status === "opened") {
                      handleReset();
                    } else {
                      Alert.alert("설치되어 있지 않아요", `"${c.name}" 앱이 이 폰에 없어요.\n앱 스토어에서 설치해 주세요.`, [{ text: "확인" }]);
                    }
                  }}
                >
                  <Text style={styles.appCandidateEmoji}>{c.emoji}</Text>
                  <Text style={styles.appCandidateName}>{c.name}</Text>
                  <Text style={styles.appCandidateChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {screen.type === "contact_candidates" && (
            <>
              <Text style={styles.sectionTitle}>누구에게 전화할까요?</Text>
              {screen.candidates.map((c) => (
                <View key={c.id} style={styles.candidateRow}>
                  <ContactCandidateCard
                    candidate={c}
                    onPress={() => setScreen({ type: "confirming_contact", candidate: c, requestId: screen.requestId })}
                  />
                  <TouchableOpacity style={styles.starButton} onPress={() => handleAddFavorite(c)} accessibilityLabel="즐겨찾기 추가">
                    <Text style={styles.starText}>☆</Text>
                  </TouchableOpacity>
                </View>
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
              <TouchableOpacity
                style={styles.kakaoMapBtn}
                onPress={() => {
                  const q = encodeURIComponent(screen.query);
                  Linking.openURL(`kakaomap://search?q=${q}`).catch(() =>
                    Linking.openURL(`https://map.kakao.com/?q=${q}`)
                  );
                }}
              >
                <Text style={styles.kakaoMapBtnText}>🗺  카카오맵에서 더 보기</Text>
              </TouchableOpacity>
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
              <TouchableOpacity style={[styles.runButton, Shadow.button]} onPress={() => handleConfirmBusiness(screen.business, screen.requestId)}>
                <Text style={styles.runButtonEmoji}>📞</Text>
                <Text style={styles.runButtonText}>전화할게요</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
                <Text style={styles.ghostButtonText}>전화하지 않을게요</Text>
              </TouchableOpacity>
            </View>
          )}

          {screen.type === "safety_alert" && (() => {
            const SAFETY_META: Record<string, { emoji: string; title: string; msg: string }> = {
              fall_risk:            { emoji: "🚨", title: "넘어지셨나요?",     msg: "많이 다치지 않으셨는지 걱정돼요.\n통증이 심하시면 119에 전화하세요." },
              medication_concern:   { emoji: "💊", title: "약을 못 드셨군요",  msg: "지금이라도 드실 수 있으면 드세요.\n많이 지나셨으면 의사 선생님께 여쭤보세요." },
              nutrition_concern:    { emoji: "🍚", title: "식사를 못 하셨군요", msg: "조금이라도 드셔야 기운이 나요.\n간단한 것이라도 챙겨 드세요." },
              mental_health_concern:{ emoji: "💙", title: "힘드신가요?",        msg: "그런 마음이 드실 때가 있어요.\n가까운 분께 연락해 보시는 건 어떨까요?" },
              mobility_concern:     { emoji: "🦯", title: "거동이 불편하신가요?", msg: "무리하지 마시고 천천히 움직여 주세요.\n필요하면 도움을 요청하세요." },
              social_isolation:     { emoji: "🤝", title: "외로우신가요?",      msg: "혼자 있는 시간이 길면 힘드시죠.\n가족이나 이웃에게 연락해 보세요." },
              urgent_medical:       { emoji: "🏥", title: "몸이 많이 안 좋으신가요?", msg: "증상이 심하시면 즉시 119에 전화하세요." },
            };
            const meta = SAFETY_META[screen.category] ?? SAFETY_META.urgent_medical;
            return (
              <View style={[styles.safetyCard, Shadow.card]}>
                <Text style={styles.safetyEmoji}>{meta.emoji}</Text>
                <Text style={styles.safetyTitle}>{meta.title}</Text>
                <Text style={styles.safetyMsg}>{meta.msg}</Text>
                <TouchableOpacity
                  style={[styles.runButton, Shadow.button, { backgroundColor: "#C0392B" }]}
                  onPress={() => Linking.openURL("tel:119")}
                >
                  <Text style={styles.runButtonText}>119 바로 전화</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
                  <Text style={styles.ghostButtonText}>괜찮아요, 돌아가기</Text>
                </TouchableOpacity>
              </View>
            );
          })()}

          {screen.type === "general_answer" && (
            <View style={[styles.answerCard, Shadow.card]}>
              <Text style={styles.answerQuestion}>🎤  "{screen.question}"</Text>
              <View style={styles.answerDivider} />
              <Text style={styles.answerText}>{stripMarkdown(screen.answer)}</Text>
              <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
                <Text style={styles.ghostButtonText}>홈으로 돌아가기</Text>
              </TouchableOpacity>
            </View>
          )}

          {screen.type === "result" && (
            <View style={[styles.resultCard, Shadow.card, screen.isError && styles.resultCardError]}>
              <Text style={styles.resultEmoji}>{screen.isError ? "⚠️" : "✅"}</Text>
              <Text style={[styles.resultText, screen.isError && styles.resultTextError]}>{screen.message}</Text>
              <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
                <Text style={styles.ghostButtonText}>홈으로 돌아가기</Text>
              </TouchableOpacity>
            </View>
          )}

          {(screen.type === "contact_candidates" || screen.type === "business_candidates" || screen.type === "app_candidates") && (
            <TouchableOpacity style={styles.ghostButton} onPress={handleReset}>
              <Text style={styles.ghostButtonText}>취소할게요</Text>
            </TouchableOpacity>
          )}

          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.navyDeep,
    paddingTop: (StatusBar.currentHeight ?? 24) + 8,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
    flex: 0.65,
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
  sosButton: {
    backgroundColor: "#C0392B",
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  sosText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  inputSheet: {
    flex: 0.35,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.placeholder,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  inputSheetInner: { padding: Spacing.xl, gap: Spacing.md },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  favRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 6,
  },
  favMain: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  favName: { fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary },
  favPhone: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
  favDelete: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  favDeleteText: { fontSize: 16, color: Colors.textMuted },
  reminderRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 6,
  },
  reminderMain: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  reminderName: { fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary },
  reminderTime: { fontSize: FontSize.caption, color: Colors.primary, marginTop: 2 },
  orRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500", letterSpacing: 0.5 },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
  },
  input: { fontSize: FontSize.body, color: Colors.textPrimary, paddingVertical: Spacing.md },
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
  runButtonEmoji: { fontSize: 20 },
  runButtonText: { color: "#FFFFFF", fontSize: FontSize.buttonLabel, fontWeight: "700" },
  addReminderButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  addReminderText: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: "600" },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  statusBoxDanger: { backgroundColor: Colors.dangerBg },
  statusEmoji: { fontSize: 22 },
  statusText: { flex: 1, fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 24 },
  dangerText: { flex: 1, fontSize: FontSize.caption, color: Colors.danger, lineHeight: 24 },
  centerFull: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.lg },
  searchingText: { fontSize: FontSize.body, color: Colors.textSecondary },
  contentFull: { flex: 1 },
  contentInner: { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.headingLarge, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.sm },
  candidateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  starText: { fontSize: 22 },
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
    borderWidth: 2,
    borderColor: Colors.accentWarm,
  },
  confirmEmoji: { fontSize: 34 },
  confirmName: { fontSize: FontSize.headingLarge, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },
  confirmSub: { fontSize: FontSize.caption, color: Colors.textMuted, textAlign: "center" },
  confirmQuestion: { fontSize: FontSize.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  resultCardError: { backgroundColor: Colors.dangerBg },
  resultEmoji: { fontSize: 52 },
  resultText: { fontSize: FontSize.heading, fontWeight: "700", color: Colors.successText, textAlign: "center", lineHeight: 36 },
  resultTextError: { color: Colors.danger },
  ghostButton: { minHeight: TouchSize.minimum, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.xl },
  ghostButtonText: { fontSize: FontSize.body, color: Colors.textMuted, fontWeight: "500" },
  safetyCard: {
    backgroundColor: Colors.dangerTint,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  safetyEmoji: { fontSize: 56 },
  safetyTitle: {
    fontSize: FontSize.headingLarge,
    fontWeight: "800",
    color: Colors.dangerDeep,
    textAlign: "center",
  },
  safetyMsg: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 28,
  },
  answerCard: {
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  answerQuestion: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontStyle: "italic",
    lineHeight: 22,
  },
  answerDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  answerText: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: 30,
    fontFamily: FontFamily.headingMedium,
  },
  kakaoMapBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  kakaoMapBtnText: { fontSize: FontSize.body, color: Colors.primary, fontWeight: "700" },
  appCandidateRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  appCandidateEmoji: { fontSize: 28 },
  appCandidateName: { flex: 1, fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary },
  appCandidateChevron: { fontSize: 24, color: Colors.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.heading, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    minHeight: TouchSize.minimum,
  },
});
