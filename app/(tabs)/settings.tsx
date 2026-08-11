import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Modal, Alert,
} from "react-native";
import { getLinkData, clearLink, type LinkData } from "@/features/supabase/linkService";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow, TouchSize } from "@/components/tokens";
import { getDevStats } from "@/features/recommendation/RecommendationEngine";

export default function SettingsScreen() {
  const [linkData, setLinkData]         = useState<LinkData>({ linked: false });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [devStats, setDevStats]         = useState<{ totalLogs: number; contactCount: number; coldStart: boolean } | null>(null);

  useEffect(() => {
    getLinkData().then(setLinkData).catch(() => {});
  }, []);

  function handleDisconnect() {
    Alert.alert("연결 해제", "SilverLink 연결을 해제할까요?", [
      { text: "취소", style: "cancel" },
      { text: "해제", style: "destructive", onPress: async () => {
        await clearLink();
        setLinkData({ linked: false });
      }},
    ]);
  }

  async function handleDevStatsToggle() {
    if (devStats) { setDevStats(null); return; }
    const stats = await getDevStats();
    setDevStats(stats);
  }

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.headerTitle}>설정</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* SilverLink 연결 */}
        <Text style={s.groupLabel}>SilverLink 연결</Text>
        <View style={[s.card, Shadow.card]}>
          <View style={s.linkRow}>
            <Text style={s.linkEmoji}>{linkData.linked ? "✅" : "⚙️"}</Text>
            <View style={s.linkInfo}>
              <Text style={s.linkName}>
                {linkData.linked ? `${linkData.elderName} 어르신` : "연결되지 않음"}
              </Text>
              <Text style={s.linkDesc}>
                {linkData.linked
                  ? "SilverLink와 연결되어 있어요"
                  : "연결하면 안전 알림을 자동으로 전달해요"}
              </Text>
            </View>
          </View>

          {linkData.linked ? (
            <TouchableOpacity style={s.dangerBtn} onPress={handleDisconnect} accessibilityLabel="연결 해제">
              <Text style={s.dangerBtnText}>연결 해제</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.primaryBtn, Shadow.button]} onPress={() => setShowOnboarding(true)}>
              <Text style={s.primaryBtnText}>SilverLink 연결하기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 앱 정보 */}
        <Text style={[s.groupLabel, { marginTop: Spacing.xl }]}>앱 정보</Text>
        <View style={[s.card, Shadow.card]}>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>버전</Text>
            <Text style={s.infoVal}>0.1.0 (빌드 41)</Text>
          </View>
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Text style={s.infoKey}>개발</Text>
            <Text style={s.infoVal}>SilverLink AI</Text>
          </View>
        </View>

        {/* 개발자 도구 */}
        <Text style={[s.groupLabel, { marginTop: Spacing.xl }]}>개발자 도구</Text>
        <View style={[s.card, Shadow.card]}>
          <TouchableOpacity style={s.devRow} onPress={handleDevStatsToggle}>
            <Text style={s.devRowText}>추천 엔진 통계</Text>
            <Text style={s.devChevron}>{devStats ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {devStats && (
            <View style={s.devStats}>
              <Text style={s.devStat}>전체 로그: {devStats.totalLogs}건</Text>
              <Text style={s.devStat}>연락처 수: {devStats.contactCount}명</Text>
              <Text style={s.devStat}>Cold Start: {devStats.coldStart ? "예 (데이터 부족)" : "아니오"}</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <Modal visible={showOnboarding} animationType="slide">
        <OnboardingScreen
          onDone={() => {
            getLinkData().then(setLinkData).catch(() => {});
            setShowOnboarding(false);
          }}
        />
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: FontFamily.heading,
  },

  content: { padding: Spacing.lg, paddingBottom: 64 },

  groupLabel: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: FontFamily.body,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  linkRow:   { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  linkEmoji: { fontSize: 28, marginTop: 2 },
  linkInfo:  { flex: 1, gap: 4 },
  linkName:  { fontSize: FontSize.body, fontWeight: "700", color: Colors.textPrimary, fontFamily: FontFamily.heading },
  linkDesc:  { fontSize: FontSize.caption, color: Colors.textMuted, lineHeight: 24, fontFamily: FontFamily.body },

  primaryBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 14, alignItems: "center", marginTop: 4, minHeight: TouchSize.minimum, justifyContent: "center" },
  primaryBtnText: { color: "#FFF", fontSize: FontSize.body, fontWeight: "700", fontFamily: FontFamily.headingMedium },

  dangerBtn:     { borderWidth: 1.5, borderColor: Colors.danger, borderRadius: Radius.pill, paddingVertical: 14, alignItems: "center", marginTop: 4, minHeight: TouchSize.minimum, justifyContent: "center" },
  dangerBtnText: { color: Colors.danger, fontSize: FontSize.body, fontWeight: "600", fontFamily: FontFamily.body },

  infoRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, minHeight: 48 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  infoKey:       { fontSize: FontSize.caption, color: Colors.textMuted, fontFamily: FontFamily.body },
  infoVal:       { fontSize: FontSize.caption, color: Colors.textPrimary, fontWeight: "600", fontFamily: FontFamily.body },

  devRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, minHeight: 48 },
  devRowText: { fontSize: FontSize.body, color: Colors.textPrimary, fontFamily: FontFamily.body },
  devChevron: { fontSize: FontSize.body, color: Colors.textMuted },
  devStats:   { gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  devStat:    { fontSize: FontSize.caption, color: Colors.textSecondary, fontFamily: FontFamily.body },
});
