import { useState, useEffect } from "react";
import {
  View, Text, SectionList, StyleSheet, StatusBar,
} from "react-native";
import { getLogs, type LogEntry } from "@/features/conversation-log/ConversationLogService";
import { Colors, FontFamily, FontSize, Spacing, Radius } from "@/components/tokens";

type Section = { date: string; label: string; data: LogEntry[] };

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function buildSections(logs: LogEntry[]): Section[] {
  const map = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const d = new Date(log.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }

  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  const yestMid  = new Date(todayMid); yestMid.setDate(todayMid.getDate() - 1);

  return Array.from(map.entries()).map(([key, entries]) => {
    const d = new Date(entries[0].timestamp); d.setHours(0, 0, 0, 0);
    const label =
      d.getTime() === todayMid.getTime() ? "오늘" :
      d.getTime() === yestMid.getTime()  ? "어제" :
      `${d.getMonth() + 1}월 ${d.getDate()}일`;
    return { date: key, label, data: entries };
  });
}

export default function HistoryScreen() {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    getLogs().then((logs) => setSections(buildSections(logs)));
  }, []);

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.headerTitle}>대화 기록</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, sections.length === 0 && s.listEmpty]}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTitle}>아직 기록이 없어요</Text>
            <Text style={s.emptySub}>AI 며느리와 대화하면{"\n"}여기에 기록이 쌓여요</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={s.dayHeader}>
            <Text style={s.dayLabel}>{section.label}</Text>
            <View style={s.dayLine} />
          </View>
        )}
        renderItem={({ item }) => (
          <View style={s.logRow}>
            <Text style={s.logEmoji}>{item.emoji}</Text>
            <Text style={s.logSummary} numberOfLines={2}>{item.summary}</Text>
            <Text style={s.logTime}>{formatTime(item.timestamp)}</Text>
          </View>
        )}
      />
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

  list:      { padding: Spacing.lg, paddingBottom: 48 },
  listEmpty: { flex: 1 },

  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  dayLabel: {
    fontSize: FontSize.caption,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: FontFamily.body,
  },
  dayLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  logRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginBottom: 8,
    gap: 10,
  },
  logEmoji:   { fontSize: 22, width: 30 },
  logSummary: { flex: 1, fontSize: FontSize.caption, color: Colors.textPrimary, lineHeight: 26, fontFamily: FontFamily.body },
  logTime:    { fontSize: FontSize.caption, color: Colors.textMuted, fontFamily: FontFamily.body },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 80 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.heading, fontWeight: "700", color: Colors.textPrimary, fontFamily: FontFamily.heading },
  emptySub:   { fontSize: FontSize.caption, color: Colors.textMuted, textAlign: "center", lineHeight: 28, fontFamily: FontFamily.body },
});
