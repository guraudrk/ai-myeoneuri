import { useState, useRef, useMemo, useEffect, useCallback } from "react";
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
  Dimensions,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, FontFamily, FontSize, TouchSize, Spacing, Shadow, Radius } from "@/components/tokens";
import type { AppCandidate } from "@/features/intent/intentParser";
import { LargeMicrophoneButton, type MicState } from "@/components/LargeMicrophoneButton";
import { ContactCandidateCard } from "@/components/ContactCandidateCard";
import { ConfirmationPanel } from "@/components/ConfirmationPanel";
import { CallCountdownDialog } from "@/components/CallCountdownDialog";
import { BusinessCandidateCard } from "@/components/BusinessCandidateCard";
import { searchContacts, dialContact } from "@/services/contactCallService";
import { searchBusinesses, dialBusiness } from "@/services/businessCallService";
import { createRealContactsAdapter } from "@/features/contacts/RealContactsAdapter";
import { createRealPhoneAdapter } from "@/features/calling/RealPhoneAdapter";
import { createRealLocationAdapter } from "@/features/location/RealLocationAdapter";
import { createKakaoBusinessSearchAdapter } from "@/features/business/KakaoBusinessSearchAdapter";
import { createExpoSpeechAdapter } from "@/features/speech/ExpoSpeechAdapter";
import { parseIntent, askGemini, openAppByName } from "@/features/intent/intentParser";
import type { SafetySeverity } from "@/features/intent/intentParser";
import { speak, stop as ttsStop } from "@/features/tts/TtsService";
import { addLog, getTodayLogs, type LogEntry } from "@/features/conversation-log/ConversationLogService";
import { saveMapping } from "@/features/contacts/RelationshipMapper";
import { reportSafetyConcernToSilverLink } from "@/features/safetyLink/safetyAlertBridge";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  type FavoriteContact,
} from "@/features/favorites/FavoritesAdapter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLinkData, type LinkData } from "@/features/supabase/linkService";
import { useFocusEffect } from "expo-router";
import type { ContactCandidate } from "@/domain/types";
import type { BusinessCandidate } from "@/features/business/BusinessSearchAdapter";
import {
  getTopRecommendation,
  type Recommendation,
} from "@/features/recommendation/RecommendationEngine";
import {
  markRecommendationShown,
  markRecommendationAccepted,
  snoozeRecommendation,
  appendEventLog,
} from "@/features/recommendation/EventLogService";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

function todayLabel(): string {
  const d = new Date();
  const DAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}`;
}

const contactsAdapter = createRealContactsAdapter();
const phoneAdapter    = createRealPhoneAdapter();
const locationAdapter = createRealLocationAdapter();
const businessAdapter = createKakaoBusinessSearchAdapter();

let requestCounter = 0;
function nextRequestId() { return `req-${++requestCounter}-${Date.now()}`; }

type ScreenState =
  | { type: "idle" }
  | { type: "searching" }
  | { type: "contact_candidates"; candidates: ContactCandidate[]; requestId: string }
  | { type: "business_candidates"; candidates: BusinessCandidate[]; requestId: string; query: string }
  | { type: "confirming_contact"; candidate: ContactCandidate; requestId: string }
  | { type: "countdown_contact"; candidate: ContactCandidate; requestId: string }
  | { type: "confirming_business"; business: BusinessCandidate; requestId: string }
  | { type: "general_answer"; question: string; answer: string }
  | { type: "safety_alert"; category: string; severity: SafetySeverity; utterance: string }
  | { type: "app_candidates"; candidates: AppCandidate[]; appFamily: string }
  | { type: "permission_denied"; reason: "contacts" | "location" }
  | { type: "relationship_picker"; relationship: string; allContacts: ContactCandidate[] };

export default function HomeScreen() {
  const [input, setInput]               = useState("");
  const [screen, setScreen]             = useState<ScreenState>({ type: "idle" });
  const [isListening, setIsListening]   = useState(false);
  const [micError, setMicError]         = useState(false);
  const [favorites, setFavorites]       = useState<FavoriteContact[]>([]);
  const [todayLogs, setTodayLogs]       = useState<LogEntry[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [searchingMsg, setSearchingMsg]   = useState("찾고 있어요…");
  const [linkData, setLinkData]           = useState<LinkData>({ linked: false });
  const [rec, setRec]                     = useState<Recommendation | null>(null);
  const [relSearch, setRelSearch] = useState("");
  const [contactPickerSearch, setContactPickerSearch] = useState("");
  const [contactPickerAll, setContactPickerAll] = useState<ContactCandidate[]>([]);
  const insets = useSafeAreaInsets();
  const speechAdapter = useMemo(() => createExpoSpeechAdapter(), []);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const searchMsgCyclerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadFavorites();
    loadTodayLogs();
    getLinkData().then(setLinkData).catch(() => {});
    runDailyGreeting();
    loadRecommendation();
    return () => { ttsStop(); };
  }, []);

  // 탭 전환 후 돌아올 때 즐겨찾기 갱신
  useFocusEffect(useCallback(() => { loadFavorites(); }, []));

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen.type !== "idle") { handleReset(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [screen.type]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    if (screen.type !== "relationship_picker") setRelSearch("");
    if (screen.type !== "contact_candidates") { setContactPickerSearch(""); }
  }, [screen.type]);

  useEffect(() => {
    if (screen.type !== "searching") {
      if (searchMsgCyclerRef.current) {
        clearInterval(searchMsgCyclerRef.current);
        searchMsgCyclerRef.current = null;
      }
      return;
    }
    const msgs = ["조금만 기다려 주세요…", "열심히 보고 있어요…", "거의 다 됐어요…", "잠깐만요…"];
    let i = -1;
    searchMsgCyclerRef.current = setInterval(() => {
      i = (i + 1) % msgs.length;
      setSearchingMsg(msgs[i]);
    }, 800);
    return () => {
      if (searchMsgCyclerRef.current) {
        clearInterval(searchMsgCyclerRef.current);
        searchMsgCyclerRef.current = null;
      }
    };
  }, [screen.type]);

  async function loadFavorites() { setFavorites(await getFavorites()); }
  async function loadTodayLogs() { setTodayLogs(await getTodayLogs()); }

  async function loadRecommendation() {
    try {
      const r = await getTopRecommendation();
      setRec(r);
      if (r) await markRecommendationShown(r.contactId);
    } catch { /* 추천 없어도 계속 */ }
  }

  async function runDailyGreeting() {
    try {
      const stored = await AsyncStorage.getItem("greeting_date_v1");
      const today = new Date().toISOString().slice(0, 10);
      if (stored === today) return;
      await AsyncStorage.setItem("greeting_date_v1", today);
      const d = new Date();
      const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
      const greeting = `안녕하세요. 오늘은 ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일이에요.`;
      setTimeout(() => speak(greeting).catch(() => {}), 1200);
    } catch { /* 무시 */ }
  }

  async function handleSearch(utterance?: string) {
    const query = (utterance ?? input).trim();
    if (!query) return;
    setShowTextInput(false);
    setInput("");
    setMicError(false);

    // 키워드로 초기 메시지를 미리 추정
    const initialMsg =
      /전화|연락|통화/.test(query) ? "연락처 찾는 중…" :
      /날씨|기온|비|눈|맑/.test(query) ? "날씨 확인 중…" :
      /어디|근처|가까운|찾아/.test(query) ? "주변 검색 중…" :
      /날짜|요일|몇 시|시간|오늘/.test(query) ? "시간 확인 중…" :
      "찾아보고 있어요…";
    setSearchingMsg(initialMsg);
    setScreen({ type: "searching" });

    const parsed = await parseIntent(query, {
      onRetry: () => setSearchingMsg("조금만 기다려 주세요…"),
    });

    // 인텐트 확정 후 메시지 업데이트
    const intentMsg: Partial<Record<string, string>> = {
      call_contact:    "연락처 찾는 중…",
      search_business: "주변 검색 중…",
      general_question:"답변 정리 중…",
      date_time:       "날짜 확인 중…",
      safety_concern:  "상황 확인 중…",
      open_app:        "앱 찾는 중…",
    };
    if (intentMsg[parsed.intent]) setSearchingMsg(intentMsg[parsed.intent]!);

    if (parsed.intent === "sos") { setScreen({ type: "idle" }); handleSOS(); return; }

    if (parsed.intent === "open_app") {
      const result = await openAppByName(parsed.appName, parsed.packageName);
      if (result.status === "opened") {
        await addLog("📱", `${parsed.appName} 켰어요`);
        loadTodayLogs();
        setScreen({ type: "idle" });
      } else if (result.status === "ambiguous") {
        setScreen({ type: "app_candidates", candidates: result.candidates, appFamily: parsed.appName });
      } else {
        setScreen({ type: "idle" });
        Alert.alert("앱을 찾을 수 없어요", `"${parsed.appName}" 앱이 설치되어 있지 않아요.`);
      }
      return;
    }

    if (parsed.intent === "safety_concern") {
      const ttsText = parsed.severity === "high"
        ? `긴급 상황인가요? 많이 힘드시면 지금 바로 119에 전화하세요.`
        : `괜찮으세요? 걱정이 되어서요.`;
      setScreen({ type: "safety_alert", category: parsed.category, severity: parsed.severity, utterance: parsed.utterance });
      speak(ttsText).catch(() => {});
      reportSafetyConcernToSilverLink(parsed.category, parsed.severity, parsed.utterance).catch(() => {});
      return;
    }

    if (parsed.intent === "general_question") {
      if (/날씨|기온|강수|우산/.test(parsed.utterance)) {
        await addLog("🌤️", "날씨 확인");
        loadTodayLogs();
        Linking.openURL("https://search.naver.com/search.naver?query=현재%20날씨").catch(() => {});
        setScreen({ type: "idle" });
        return;
      }
      if (/환율|달러|엔화|위안|유로|원달러|외화|파운드/.test(parsed.utterance)) {
        const currencyMap: [RegExp, string][] = [
          [/엔화|엔|일본/,     "엔화 환율"],
          [/위안|인민폐|중국/, "위안 환율"],
          [/유로/,             "유로 환율"],
          [/파운드|영국/,      "파운드 환율"],
          [/달러|미국|원달러/, "달러 환율"],
        ];
        let searchQuery = "환율";
        for (const [regex, q] of currencyMap) {
          if (regex.test(parsed.utterance)) { searchQuery = q; break; }
        }
        await addLog("💱", searchQuery);
        loadTodayLogs();
        Linking.openURL(`https://search.naver.com/search.naver?query=${encodeURIComponent(searchQuery)}`).catch(() => {});
        setScreen({ type: "idle" });
        return;
      }
      setSearchingMsg("정리하고 있어요…");
      const answer = await askGemini(parsed.utterance, {
        onRetry: () => setSearchingMsg("조금만 기다려 주세요…"),
      });
      setScreen({ type: "general_answer", question: parsed.utterance, answer });
      speak(answer).catch(() => {});
      await addLog("💬", parsed.utterance.slice(0, 24));
      loadTodayLogs();
      return;
    }

    if (parsed.intent === "search_business") {
      const result = await searchBusinesses(parsed.query, locationAdapter, businessAdapter);
      if (result.status === "location_denied") {
        setScreen({ type: "permission_denied", reason: "location" });
      } else if (result.status === "search_error") {
        setScreen({ type: "idle" });
        Alert.alert("검색 오류", result.reason);
      } else if (result.status === "no_results") {
        setScreen({ type: "idle" });
        Alert.alert("", "찾을 수 없었어요.\n다시 말씀해 주세요.");
      } else {
        setScreen({ type: "business_candidates", candidates: result.candidates, requestId: nextRequestId(), query: parsed.query });
      }
      return;
    }

    if (parsed.intent === "date_time") {
      const d = new Date();
      const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
      const answer = `오늘은 ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일이고, 지금 시각은 ${d.getHours()}시 ${d.getMinutes().toString().padStart(2, "0")}분이에요.`;
      setScreen({ type: "general_answer", question: query, answer });
      speak(answer).catch(() => {});
      await addLog("📅", "날짜·시간 확인");
      loadTodayLogs();
      return;
    }

    if (parsed.intent === "conversation_summary") {
      const logs = await getTodayLogs();
      let answer: string;
      if (logs.length === 0) {
        answer = "오늘 아직 기록이 없어요.";
      } else {
        const items = logs.map((l) => l.summary).join(", ");
        answer = `오늘 ${logs.length}가지를 했어요. ${items}.`;
      }
      setScreen({ type: "general_answer", question: query, answer });
      speak(answer).catch(() => {});
      return;
    }

    if (parsed.intent === "emergency_family") {
      const favs = await getFavorites();
      if (favs.length > 0) {
        const first = favs[0];
        const result = await dialContact(nextRequestId(), first.id, first.name, contactsAdapter, phoneAdapter);
        if (result.status === "dialer_opened") {
          await addLog("📞", `${result.contactName} 님께 긴급 연락`);
          loadTodayLogs();
          handleReset();
        } else {
          Alert.alert("연락 실패", `${first.name} 님 번호를 찾을 수 없어요.`);
          handleReset();
        }
      } else {
        setScreen({ type: "idle" });
        Alert.alert("긴급 연락", "즐겨찾기에 가족을 추가하시면\n바로 연락드릴 수 있어요.\n\n지금은 119로 연결해 드릴까요?", [
          { text: "취소", style: "cancel" },
          { text: "119 전화", style: "destructive", onPress: () => Linking.openURL("tel:119") },
        ]);
      }
      return;
    }

    if (parsed.intent === "calm_down") {
      const answer = "괜찮아요. 천천히 숨을 크게 들이쉬고 내쉬어 보세요. 제가 여기 있으니까 걱정하지 않으셔도 돼요. 가족에게 연락하거나 119에 전화하려면 말씀해 주세요.";
      setScreen({ type: "general_answer", question: query, answer });
      speak(answer).catch(() => {});
      await addLog("💙", "안심 안내");
      loadTodayLogs();
      return;
    }

    if (parsed.intent === "set_reminder") {
      setScreen({ type: "idle" });
      Alert.alert("", "알림 기능은 지금 지원하지 않아요.\n다른 것을 물어봐 주세요.");
      return;
    }

    if (parsed.intent === "call_contact") {
      const result = await searchContacts(parsed.contactName || query, contactsAdapter);
      if (result.status === "permission_denied") {
        setScreen({ type: "permission_denied", reason: "contacts" });
      } else if (result.status === "unmapped_relationship") {
        const all = await contactsAdapter.searchContacts("");
        setScreen({ type: "relationship_picker", relationship: result.relationship, allContacts: all });
      } else if (result.status === "no_results") {
        setScreen({ type: "idle" });
        Alert.alert("", "찾을 수 없었어요.\n다시 말씀해 주세요.");
      } else {
        const allC = await contactsAdapter.searchContacts("");
        setContactPickerAll(allC);
        setScreen({ type: "contact_candidates", candidates: result.candidates, requestId: nextRequestId() });
      }
      return;
    }

    const result = await searchContacts(query, contactsAdapter);
    if (result.status === "permission_denied") {
      setScreen({ type: "permission_denied", reason: "contacts" });
    } else if (result.status === "unmapped_relationship") {
      const all = await contactsAdapter.searchContacts("");
      setScreen({ type: "relationship_picker", relationship: result.relationship, allContacts: all });
    } else if (result.status === "no_results") {
      setScreen({ type: "idle" });
      Alert.alert("", "찾을 수 없었어요.\n다시 말씀해 주세요.");
    } else {
      const allC = await contactsAdapter.searchContacts("");
      setContactPickerAll(allC);
      setScreen({ type: "contact_candidates", candidates: result.candidates, requestId: nextRequestId() });
    }
  }

  async function handleMicPress() {
    if (isListening) { await speechAdapter.stopListening(); setIsListening(false); return; }
    setMicError(false);
    setIsListening(true);
    await speechAdapter.startListening(
      (text) => { setIsListening(false); handleSearch(text); },
      (err)  => {
        setIsListening(false);
        setMicError(true);
        // 에러 표시 후 3초 뒤 idle 복구
        setTimeout(() => setMicError(false), 3000);
        Alert.alert("음성 인식 오류", err);
      }
    );
  }

  function handleSOS() {
    Alert.alert("🆘 긴급 전화", "119에 전화하시겠어요?", [
      { text: "취소", style: "cancel" },
      { text: "119 전화", style: "destructive", onPress: () => Linking.openURL("tel:119") },
    ]);
  }

  async function handleConfirmContact(candidate: ContactCandidate, requestId: string) {
    const result = await dialContact(requestId, candidate.id, candidate.name, contactsAdapter, phoneAdapter);
    if (result.status === "dialer_opened") {
      await addLog("📞", `${result.contactName} 님께 전화`);
      loadTodayLogs();
      handleReset();
    } else if (result.status === "duplicate_blocked") {
      Alert.alert("", "이미 전화 화면을 열었어요.");
      handleReset();
    } else {
      const msg = result.status === "phone_not_found"
        ? "전화번호를 찾을 수 없어요."
        : (result as { status: "error"; message: string }).message;
      Alert.alert("전화 오류", msg);
      handleReset();
    }
  }

  async function handleConfirmBusiness(business: BusinessCandidate, requestId: string) {
    const result = await dialBusiness(requestId, business, phoneAdapter);
    if (result.status === "dialer_opened") {
      await addLog("🏪", `${result.businessName} 전화`);
      loadTodayLogs();
      handleReset();
    } else if (result.status === "duplicate_blocked") {
      Alert.alert("", "이미 전화 화면을 열었어요.");
      handleReset();
    } else {
      Alert.alert("전화 오류", (result as { status: "error"; message: string }).message);
      handleReset();
    }
  }

  async function handleAddFavorite(candidate: ContactCandidate) {
    Alert.alert(
      "가족 추가",
      `${candidate.name} 님을 즐겨찾기(가족)에 추가할까요?`,
      [
        { text: "취소", style: "cancel" },
        { text: "추가할게요", onPress: async () => {
          await addFavorite({ id: candidate.id, name: candidate.name });
          setFavorites(await getFavorites());
          Alert.alert("완료", `${candidate.name} 님을 가족으로 추가했어요 😊`);
        }},
      ]
    );
  }

  async function handleFavoriteDial(fav: FavoriteContact) {
    const result = await dialContact(nextRequestId(), fav.id, fav.name, contactsAdapter, phoneAdapter);
    if (result.status === "dialer_opened") {
      await addLog("📞", `${result.contactName} 님께 전화`);
      loadTodayLogs();
    } else {
      Alert.alert("전화 오류", result.status === "phone_not_found" ? "전화번호를 찾을 수 없어요." : "전화 연결에 실패했어요.");
    }
  }

  async function handleRemoveFavorite(id: string) {
    await removeFavorite(id);
    setFavorites(await getFavorites());
  }

  async function handleRelationshipSelect(relationship: string, candidate: ContactCandidate) {
    await saveMapping(relationship, candidate.id);
    setScreen({ type: "confirming_contact", candidate, requestId: nextRequestId() });
  }

  // ─── 추천 핸들러 ─────────────────────────────────────────────────────────────
  async function handleRecDial(recommendation: Recommendation) {
    await markRecommendationAccepted(recommendation.contactId);
    const result = await dialContact(
      nextRequestId(), recommendation.contactId, recommendation.contactName,
      contactsAdapter, phoneAdapter
    );
    if (result.status === "dialer_opened") {
      await addLog("📞", `${recommendation.contactName} 님께 전화 (추천)`);
      await appendEventLog({
        type: "call", targetId: recommendation.contactId, targetName: recommendation.contactName,
        startedAt: Date.now(), durationSec: 0, outcome: "success", source: "suggestion",
      });
      loadTodayLogs();
      setRec(null);
    } else {
      Alert.alert("전화 오류", "전화번호를 찾을 수 없어요.");
    }
  }

  async function handleRecSnooze(recommendation: Recommendation) {
    await snoozeRecommendation(recommendation.contactId);
    setRec(null);
  }

  function handleReset() {
    setInput("");
    setIsListening(false);
    setMicError(false);
    setShowTextInput(false);
    speechAdapter.stopListening();
    ttsStop();
    setScreen({ type: "idle" });
  }

  function initial(name: string) { return name.trim()[0] ?? "?"; }

  const micState: MicState =
    screen.type === "searching" ? "processing" :
    micError                    ? "error"       :
    isListening                 ? "listening"   :
    "idle";

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* ─── 직접 입력 모달 ─── */}
      <Modal visible={showTextInput} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, Shadow.card]}>
            <Text style={s.modalTitle}>⌨️ 직접 입력</Text>
            <TextInput
              style={s.modalInput}
              value={input}
              onChangeText={setInput}
              placeholder="예: 딸한테 전화해 줘"
              placeholderTextColor={Colors.placeholder}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
              autoFocus
            />
            <TouchableOpacity style={[s.primaryBtn, Shadow.button]} onPress={() => handleSearch()}>
              <Text style={s.primaryBtnText}>실행하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => { setShowTextInput(false); setInput(""); }}>
              <Text style={s.ghostBtnText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── 전화 카운트다운 다이얼로그 ─── */}
      <CallCountdownDialog
        visible={screen.type === "countdown_contact"}
        contactName={screen.type === "countdown_contact" ? screen.candidate.name : ""}
        onConfirm={() => {
          if (screen.type === "countdown_contact")
            handleConfirmContact(screen.candidate, screen.requestId);
        }}
        onCancel={handleReset}
      />

      {/* ══════ IDLE 화면 ══════ */}
      {screen.type === "idle" && (
        <ScrollView style={s.idleRoot} contentContainerStyle={s.idleScrollContent} showsVerticalScrollIndicator={false}>

            {/* ── 상단 그룹: 헤더 · 인사말 · 추천 카드 ── */}
            <View style={[s.topGroup, { paddingTop: insets.top + 8 }]}>
              <View style={s.headerRow}>
                <Text style={s.dateLabel}>{todayLabel()}</Text>
                {linkData.linked && (
                  <View style={s.linkedBadge}>
                    <Text style={s.linkedText}>🔗 {linkData.elderName}</Text>
                  </View>
                )}
              </View>
              <Text style={s.heroTitle}>
                {isListening ? "말씀해\n주세요" : "무엇을\n도와드릴까요?"}
              </Text>
              {rec && (
                <View style={[s.recCard, Shadow.card]}>
                  <Text style={s.recReason} numberOfLines={1}>💡 {rec.reason}</Text>
                  <View style={s.recActions}>
                    <TouchableOpacity style={s.recDialBtn} onPress={() => handleRecDial(rec)}>
                      <Text style={s.recDialText}>📞 {rec.contactName}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.recSnoozeBtn} onPress={() => handleRecSnooze(rec)}>
                      <Text style={s.recSnoozeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* ── 중간: 마이크 (남은 공간 전부 차지, 정중앙) ── */}
            <View style={s.micWrap}>
              <LargeMicrophoneButton micState={micState} onPress={handleMicPress} />
            </View>

            {/* ── 하단 그룹: 즐겨찾기 · 기록 · 버튼 ── */}
            <View style={s.bottomGroup}>
              {favorites.length > 0 && (
                <View style={s.favSection}>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>즐겨찾기</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.favScroll}>
                    {favorites.map((fav) => (
                      <TouchableOpacity
                        key={fav.id}
                        style={s.favCard}
                        onPress={() => handleFavoriteDial(fav)}
                        onLongPress={() => Alert.alert("즐겨찾기 삭제", `${fav.name} 님을 삭제할까요?`, [
                          { text: "취소", style: "cancel" },
                          { text: "삭제", style: "destructive", onPress: () => handleRemoveFavorite(fav.id) },
                        ])}
                        accessibilityLabel={`${fav.name} 전화`}
                      >
                        <View style={s.favAvatar}>
                          <Text style={s.favInitial}>{initial(fav.name)}</Text>
                        </View>
                        <Text style={s.favName} numberOfLines={1}>{fav.name}</Text>
                        <Text style={s.favCallLabel}>📞 전화</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {todayLogs.length > 0 && (
                <View style={s.logSection}>
                  <Text style={s.sectionLabel}>오늘 한 일</Text>
                  {todayLogs.slice(0, 2).map((log) => (
                    <View key={log.id} style={s.logRow}>
                      <Text style={s.logEmoji}>{log.emoji}</Text>
                      <Text style={s.logText} numberOfLines={1}>{log.summary}</Text>
                      <Text style={s.logTime}>{(() => {
                        const d = new Date(log.timestamp);
                        return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
                      })()}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={s.bottomRow}>
                <TouchableOpacity style={s.sosBtn} onPress={handleSOS} accessibilityLabel="긴급 SOS">
                  <Text style={s.sosBtnText}>🆘  SOS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.textInputBtn} onPress={() => setShowTextInput(true)}>
                  <Text style={s.textInputBtnText}>⌨️ 직접 입력</Text>
                </TouchableOpacity>
              </View>
            </View>

        </ScrollView>
      )}

      {/* ══════ 권한 없음 ══════ */}
      {screen.type === "permission_denied" && (
        <View style={s.idleRoot}>
          <View style={s.idleInner}>
            <View style={[s.topGroup, { paddingTop: insets.top + 8 }]}>
              <View style={s.headerRow}><Text style={s.dateLabel}>{todayLabel()}</Text></View>
              <Text style={s.heroTitle}>무엇을{"\n"}도와드릴까요?</Text>
            </View>
            <View style={s.micWrap}>
              <LargeMicrophoneButton micState="idle" onPress={handleMicPress} />
            </View>
            <View style={s.bottomGroup}>
              <View style={s.permissionBadge}>
                <Text style={s.permissionText}>
                  {screen.reason === "contacts" ? "🔒 연락처 권한이 없어요.\n설정에서 허용해 주세요." : "🔒 위치 권한이 없어요.\n설정에서 허용해 주세요."}
                </Text>
              </View>
              <View style={s.bottomRow}>
                <TouchableOpacity style={s.sosBtn} onPress={handleSOS}>
                  <Text style={s.sosBtnText}>🆘  SOS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.textInputBtn} onPress={() => setShowTextInput(true)}>
                  <Text style={s.textInputBtnText}>⌨️ 직접 입력</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ══════ 검색 중 ══════ */}
      {screen.type === "searching" && (
        <View style={s.centerFull}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.searchingText}>{searchingMsg}</Text>
        </View>
      )}

      {/* ══════ 결과 화면들 ══════ */}
      {(screen.type === "contact_candidates" ||
        screen.type === "business_candidates" ||
        screen.type === "confirming_contact" ||
        screen.type === "countdown_contact" ||
        screen.type === "confirming_business" ||
        screen.type === "general_answer" ||
        screen.type === "safety_alert" ||
        screen.type === "app_candidates" ||
        screen.type === "relationship_picker") && (
        <View style={s.resultRoot}>
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={[s.resultInner, { paddingTop: insets.top + 16 }]}>
              <Animated.View style={{ opacity: fadeAnim, gap: Spacing.md }}>

                {screen.type === "app_candidates" && (
                  <>
                    <Text style={s.sectionTitle}>어떤 앱을 여실까요?</Text>
                    {screen.candidates.map((c) => (
                      <TouchableOpacity
                        key={c.packageName}
                        style={[s.appRow, Shadow.card]}
                        onPress={async () => {
                          const r = await openAppByName(c.name, c.packageName);
                          if (r.status === "opened") handleReset();
                          else Alert.alert("설치되어 있지 않아요", `"${c.name}" 앱이 이 폰에 없어요.`);
                        }}
                      >
                        <Text style={s.appEmoji}>{c.emoji}</Text>
                        <Text style={s.appLabel}>{c.name}</Text>
                        <Text style={s.appChevron}>›</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                      <Text style={s.ghostBtnText}>취소할게요</Text>
                    </TouchableOpacity>
                  </>
                )}

                {screen.type === "contact_candidates" && (() => {
                  const filtered = contactPickerSearch.trim()
                    ? contactPickerAll.filter((c) => c.name.includes(contactPickerSearch.trim()))
                    : contactPickerAll;
                  return (
                    <>
                      <Text style={s.sectionTitle}>누구에게 전화할까요?</Text>
                      {screen.candidates.map((c) => (
                        <View key={c.id} style={s.candidateRow}>
                          <ContactCandidateCard
                            candidate={c}
                            onPress={() => setScreen({ type: "confirming_contact", candidate: c, requestId: screen.requestId })}
                          />
                          <TouchableOpacity style={s.starBtn} onPress={() => handleAddFavorite(c)} accessibilityLabel="즐겨찾기 추가">
                            <Text style={s.starText}>☆</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <View style={s.divider} />
                      <Text style={s.phonebookLabel}>전화번호부에서 찾기</Text>
                      <TextInput
                        style={s.relSearchInput}
                        value={contactPickerSearch}
                        onChangeText={setContactPickerSearch}
                        placeholder="이름으로 검색…"
                        placeholderTextColor={Colors.placeholder}
                        returnKeyType="search"
                      />
                      {filtered.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[s.relationshipRow, Shadow.card]}
                          onPress={() => setScreen({ type: "confirming_contact", candidate: c, requestId: screen.requestId })}
                        >
                          <View style={s.favAvatar}>
                            <Text style={s.favInitial}>{c.name.trim()[0] ?? "?"}</Text>
                          </View>
                          <Text style={s.relationshipName}>{c.name}</Text>
                          <Text style={s.appChevron}>›</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                        <Text style={s.ghostBtnText}>취소할게요</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}

                {screen.type === "business_candidates" && (
                  <>
                    <Text style={s.sectionTitle}>어디에 전화할까요?</Text>
                    {screen.candidates.map((b) => (
                      <BusinessCandidateCard
                        key={b.id}
                        business={b}
                        onPress={() => setScreen({ type: "confirming_business", business: b, requestId: screen.requestId })}
                      />
                    ))}
                    <TouchableOpacity
                      style={s.mapBtn}
                      onPress={() => {
                        const q = encodeURIComponent(screen.query);
                        Linking.openURL(`kakaomap://search?q=${q}`).catch(() => Linking.openURL(`https://map.kakao.com/?q=${q}`));
                      }}
                    >
                      <Text style={s.mapBtnText}>🗺  카카오맵에서 더 보기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                      <Text style={s.ghostBtnText}>취소할게요</Text>
                    </TouchableOpacity>
                  </>
                )}

                {(screen.type === "confirming_contact" || screen.type === "countdown_contact") && (
                  <ConfirmationPanel
                    candidate={screen.candidate}
                    onConfirm={() => setScreen({ type: "countdown_contact", candidate: screen.candidate, requestId: screen.requestId })}
                    onCancel={handleReset}
                  />
                )}

                {screen.type === "confirming_business" && (
                  <View style={[s.confirmCard, Shadow.card]}>
                    <View style={s.confirmIconBox}>
                      <Text style={s.confirmEmoji}>🏪</Text>
                    </View>
                    <Text style={s.confirmName}>{screen.business.name}</Text>
                    <Text style={s.confirmSub}>{screen.business.address}</Text>
                    <Text style={s.confirmQ}>지금 전화할까요?</Text>
                    <TouchableOpacity style={[s.primaryBtn, Shadow.button]} onPress={() => handleConfirmBusiness(screen.business, screen.requestId)}>
                      <Text style={s.primaryBtnText}>📞 전화할게요</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                      <Text style={s.ghostBtnText}>전화하지 않을게요</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {screen.type === "safety_alert" && (() => {
                  const META: Record<string, { emoji: string; title: string; msg: string }> = {
                    fall_risk:            { emoji: "🚨", title: "넘어지셨나요?",            msg: "많이 다치지 않으셨는지 걱정돼요.\n통증이 심하시면 119에 전화하세요." },
                    medication_concern:   { emoji: "💊", title: "약을 못 드셨군요",          msg: "지금이라도 드실 수 있으면 드세요.\n많이 지나셨으면 의사 선생님께 여쭤보세요." },
                    nutrition_concern:    { emoji: "🍚", title: "식사를 못 하셨군요",        msg: "조금이라도 드셔야 기운이 나요.\n간단한 것이라도 챙겨 드세요." },
                    mental_health_concern:{ emoji: "💙", title: "힘드신가요?",               msg: "그런 마음이 드실 때가 있어요.\n가까운 분께 연락해 보시는 건 어떨까요?" },
                    mobility_concern:     { emoji: "🦯", title: "거동이 불편하신가요?",      msg: "무리하지 마시고 천천히 움직여 주세요.\n필요하면 도움을 요청하세요." },
                    social_isolation:     { emoji: "🤝", title: "외로우신가요?",             msg: "혼자 있는 시간이 길면 힘드시죠.\n가족이나 이웃에게 연락해 보세요." },
                    urgent_medical:       { emoji: "🏥", title: "몸이 많이 안 좋으신가요?",  msg: "증상이 심하시면 즉시 119에 전화하세요." },
                  };
                  const SEVERITY_LABEL: Record<string, string> = { high: "🔴 즉시 확인 필요", medium: "🟡 확인 권장", low: "🟢 가볍게 확인" };
                  const SEVERITY_BORDER: Record<string, string> = { high: Colors.danger, medium: Colors.warning, low: Colors.success };
                  const m = META[screen.category] ?? META.urgent_medical;
                  const border = SEVERITY_BORDER[screen.severity] ?? Colors.danger;
                  return (
                    <View style={[s.safetyCard, Shadow.card, { borderColor: border }]}>
                      <View style={[s.severityPill, { backgroundColor: border + "22" }]}>
                        <Text style={[s.severityText, { color: border }]}>{SEVERITY_LABEL[screen.severity] ?? "즉시 확인 필요"}</Text>
                      </View>
                      <Text style={s.safetyEmoji}>{m.emoji}</Text>
                      <Text style={s.safetyTitle}>{m.title}</Text>
                      <Text style={s.safetyMsg}>{m.msg}</Text>
                      <TouchableOpacity style={[s.primaryBtn, Shadow.button, { backgroundColor: Colors.danger }]} onPress={() => Linking.openURL("tel:119")}>
                        <Text style={s.primaryBtnText}>119 바로 전화</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                        <Text style={s.ghostBtnText}>괜찮아요, 돌아가기</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

                {screen.type === "general_answer" && (
                  <View style={s.chatContainer}>
                    {/* 사용자 질문 말풍선 (오른쪽) */}
                    <View style={s.userBubbleRow}>
                      <View style={s.userBubble}>
                        <Text style={s.userBubbleText}>{screen.question}</Text>
                      </View>
                      <View style={s.micBadge}>
                        <Text style={{ fontSize: 16 }}>🎤</Text>
                      </View>
                    </View>

                    {/* AI 답변 말풍선 (왼쪽) */}
                    <View style={s.aiBubbleRow}>
                      <View style={s.aiAvatar}>
                        <Text style={{ fontSize: 18 }}>✨</Text>
                      </View>
                      <View style={[s.aiBubble, Shadow.card]}>
                        <Text style={s.aiAnswerText}>{stripMarkdown(screen.answer)}</Text>
                      </View>
                    </View>

                    {/* 액션 버튼 */}
                    <TouchableOpacity style={s.replayBtn} onPress={() => speak(screen.answer).catch(() => {})}>
                      <Text style={s.replayBtnText}>🔊  다시 읽기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                      <Text style={s.ghostBtnText}>홈으로 돌아가기</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {screen.type === "relationship_picker" && (() => {
                  const filtered = relSearch.trim()
                    ? screen.allContacts.filter((c) => c.name.includes(relSearch.trim()))
                    : screen.allContacts;
                  return (
                    <>
                      <View style={s.relationshipHeader}>
                        <Text style={s.sectionTitle}>어느 분이 '{screen.relationship}'이에요?</Text>
                        <Text style={s.relationshipSub}>한 번 알려주시면 다음엔 바로 전화할게요 😊</Text>
                      </View>
                      <TextInput
                        style={s.relSearchInput}
                        value={relSearch}
                        onChangeText={setRelSearch}
                        placeholder="이름으로 검색…"
                        placeholderTextColor={Colors.placeholder}
                        returnKeyType="search"
                      />
                      {filtered.length === 0 ? (
                        <Text style={s.emptyText}>
                          {relSearch.trim() ? `"${relSearch}" 연락처가 없어요.` : "연락처가 없어요."}
                        </Text>
                      ) : (
                        filtered.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={[s.relationshipRow, Shadow.card]}
                            onPress={() => handleRelationshipSelect(screen.relationship, c)}
                          >
                            <View style={s.favAvatar}>
                              <Text style={s.favInitial}>{c.name.trim()[0] ?? "?"}</Text>
                            </View>
                            <Text style={s.relationshipName}>{c.name}</Text>
                            <Text style={s.appChevron}>›</Text>
                          </TouchableOpacity>
                        ))
                      )}
                      <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                        <Text style={s.ghostBtnText}>취소할게요</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}

              </Animated.View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  idleRoot:  { flex: 1, backgroundColor: Colors.surface },
  idleInner: { flex: 1, paddingHorizontal: Spacing.lg },
  idleScrollContent: {
    minHeight: screenHeight,
    paddingHorizontal: Spacing.lg,
  },
  topGroup: {
    gap: Spacing.sm,
    alignItems: "center",
  },
  bottomGroup: {
    gap: 10,
    paddingBottom: Spacing.md,
  },

  // 헤더: 날짜 표시
  headerRow: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateLabel: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textSecondary,
    fontFamily: FontFamily.headingMedium,
  },
  linkedBadge: {
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  linkedText: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: "600" },

  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 30,
    fontFamily: FontFamily.heading,
  },

  // 추천 카드
  recCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
  },
  recReason: { flex: 1, fontSize: FontSize.caption, color: Colors.textPrimary, fontFamily: FontFamily.body },
  recActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  recDialBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  recDialText:   { color: "#FFF", fontSize: FontSize.label, fontWeight: "700", fontFamily: FontFamily.headingMedium },
  recSnoozeBtn:  { width: 32, height: 40, alignItems: "center", justifyContent: "center" },
  recSnoozeText: { fontSize: 18, color: Colors.textMuted },

  micWrap: { height: Math.round(screenHeight * 0.40), justifyContent: "center", alignItems: "center" },

  sectionLabel: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginLeft: 4,
  },

  favSection: { width: "100%", gap: 10 },
  favScroll:  { gap: 12, paddingRight: 4 },
  favCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  favAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  favInitial: { fontSize: FontSize.body, color: "#FFF", fontWeight: "700" },
  favName:      { fontSize: FontSize.caption, color: Colors.textPrimary, fontWeight: "600", maxWidth: 72, textAlign: "center" },
  favCallLabel: { fontSize: 11, color: Colors.primary, fontWeight: "600" },

  bottomRow: { flexDirection: "row", gap: 12, width: "100%" },
  sosBtn: {
    flex: 1.3,
    backgroundColor: Colors.danger,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: TouchSize.minimum,
    justifyContent: "center",
  },
  sosBtnText:     { color: "#FFF", fontSize: FontSize.buttonLabel, fontWeight: "700", fontFamily: FontFamily.heading },
  textInputBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
  },
  textInputBtnText: { color: Colors.textSecondary, fontSize: FontSize.buttonLabel, fontWeight: "500" },

  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  permissionBadge: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  permissionText: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: "center", lineHeight: 30 },

  resultRoot:  { flex: 1, backgroundColor: Colors.surface },
  resultInner: { padding: Spacing.lg, gap: Spacing.md },

  centerFull:    { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.lg, backgroundColor: Colors.surface },
  searchingText: { fontSize: FontSize.body, color: Colors.textSecondary },

  sectionTitle: { fontSize: FontSize.headingLarge, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.sm, fontFamily: FontFamily.heading },

  appRow:    { backgroundColor: Colors.background, borderRadius: Radius.md, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: 18, gap: Spacing.md },
  appEmoji:  { fontSize: 28 },
  appLabel:  { flex: 1, fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary },
  appChevron:{ fontSize: 24, color: Colors.textMuted },

  candidateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  starBtn:  { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  starText: { fontSize: 24 },

  confirmCard:    { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: "center", gap: Spacing.sm },
  confirmIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryTint, alignItems: "center", justifyContent: "center", marginBottom: Spacing.sm, borderWidth: 2, borderColor: Colors.primary },
  confirmEmoji:   { fontSize: 34 },
  confirmName:    { fontSize: FontSize.headingLarge, fontWeight: "700", color: Colors.textPrimary, textAlign: "center", fontFamily: FontFamily.heading },
  confirmSub:     { fontSize: FontSize.caption, color: Colors.textMuted, textAlign: "center" },
  confirmQ:       { fontSize: FontSize.body, color: Colors.textSecondary, marginBottom: Spacing.md },

  safetyCard:   { backgroundColor: Colors.dangerTint, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: "center", gap: Spacing.md, borderWidth: 2 },
  safetyEmoji:  { fontSize: 56 },
  safetyTitle:  { fontSize: FontSize.headingLarge, fontWeight: "800", color: Colors.dangerDeep, textAlign: "center", fontFamily: FontFamily.heading },
  safetyMsg:    { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 30 },

  // 채팅 버블 스타일 (Gemini 스타일)
  chatContainer: { gap: Spacing.md },

  userBubbleRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end", gap: 8 },
  userBubble: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "76%",
  },
  userBubbleText: { color: "#FFF", fontSize: FontSize.body, lineHeight: 26, fontFamily: "Pretendard-Regular" },
  micBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryTint, alignItems: "center", justifyContent: "center", flexShrink: 0, borderWidth: 1, borderColor: Colors.primary + "33" },

  aiBubbleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  aiBubble: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiAnswerText: { fontSize: 17, color: Colors.textPrimary, lineHeight: 32, fontFamily: "Pretendard-Regular" },

  divider: { height: 1, backgroundColor: Colors.border },

  mapBtn:     { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16, alignItems: "center", marginTop: Spacing.sm, minHeight: TouchSize.minimum, justifyContent: "center" },
  mapBtnText: { fontSize: FontSize.body, color: Colors.primary, fontWeight: "700" },

  logSection: { width: "100%", gap: 8 },
  logRow:     { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
  logEmoji:   { fontSize: 20, width: 28 },
  logText:    { flex: 1, fontSize: FontSize.body, color: Colors.textSecondary },
  logTime:    { fontSize: FontSize.caption, color: Colors.textMuted },

  severityPill: { borderRadius: Radius.pill, paddingVertical: 4, paddingHorizontal: 14, marginBottom: 4 },
  severityText: { fontSize: FontSize.caption, fontWeight: "700" },

  replayBtn:     { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 14, alignItems: "center", width: "100%", minHeight: TouchSize.minimum, justifyContent: "center" },
  replayBtnText: { fontSize: FontSize.body, color: Colors.primary, fontWeight: "600" },

  phonebookLabel: { fontSize: FontSize.caption, color: Colors.textMuted, fontWeight: "600", marginTop: 4 },
  relSearchInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  relationshipHeader: { gap: 6, marginBottom: 4 },
  relationshipSub:    { fontSize: FontSize.caption, color: Colors.textMuted },
  relationshipRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.md,
    minHeight: TouchSize.minimum,
  },
  relationshipName: { flex: 1, fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary },
  emptyText:        { fontSize: FontSize.body, color: Colors.textMuted, textAlign: "center" },

  primaryBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.pill, minHeight: TouchSize.minimum, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.xl, width: "100%" },
  primaryBtnText: { color: "#FFFFFF", fontSize: FontSize.buttonLabel, fontWeight: "700", fontFamily: FontFamily.heading },
  ghostBtn:       { minHeight: TouchSize.minimum, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.xl },
  ghostBtnText:   { fontSize: FontSize.body, color: Colors.textMuted, fontWeight: "500" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalCard:    { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.md },
  modalTitle:   { fontSize: FontSize.heading, fontWeight: "700", color: Colors.textPrimary, textAlign: "center", fontFamily: FontFamily.heading },
  modalInput:   { backgroundColor: Colors.background, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: FontSize.body, color: Colors.textPrimary, minHeight: TouchSize.minimum },
});
