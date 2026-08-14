/**
 * B-5 스미싱 경보 배너 — 어르신 폰 표시용
 * - 큰 글씨(FontSize.heading), 버튼 TouchSize.minimum 이상
 * - 위험 문자 원문은 표시하지 않는다 (PII 보호)
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import type { SmishingRisk } from "@/features/safety/smishingRules";
import {
  Colors,
  FontFamily,
  FontSize,
  LineHeight,
  Spacing,
  Radius,
  TouchSize,
  Shadow,
} from "./tokens";

interface SmishingAlertBannerProps {
  risk: Exclude<SmishingRisk, "low">;
  matchedLabels: string[];
  onDismiss: () => void;
  onReport?: () => void;
}

const RISK_CONFIG = {
  high: {
    bg: Colors.dangerBg,
    border: Colors.danger,
    text: Colors.danger,
    icon: "⚠️",
    title: "위험한 문자일 수 있어요",
    sub: "답장하거나 링크를 누르지 마세요",
  },
  medium: {
    bg: Colors.warningBg,
    border: Colors.warning,
    text: Colors.warning,
    icon: "⚠️",
    title: "의심스러운 문자예요",
    sub: "모르는 링크는 누르지 마세요",
  },
} as const;

export function SmishingAlertBanner({
  risk,
  matchedLabels,
  onDismiss,
  onReport,
}: SmishingAlertBannerProps) {
  const config = RISK_CONFIG[risk];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <Text style={[styles.icon]}>{config.icon}</Text>

      <Text style={[styles.title, { color: config.text }]}>
        {config.title}
      </Text>

      <Text style={styles.sub}>{config.sub}</Text>

      {matchedLabels.length > 0 && (
        <View style={styles.labelRow}>
          {matchedLabels.slice(0, 3).map((label) => (
            <View
              key={label}
              style={[styles.labelChip, { borderColor: config.border }]}
            >
              <Text style={[styles.labelText, { color: config.text }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.dismissButton, { borderColor: config.border }]}
          onPress={onDismiss}
          accessibilityLabel="닫기"
          accessibilityRole="button"
        >
          <Text style={[styles.dismissText, { color: config.text }]}>
            닫기
          </Text>
        </TouchableOpacity>

        {onReport && (
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: config.border }]}
            onPress={onReport}
            accessibilityLabel="가족에게 알리기"
            accessibilityRole="button"
          >
            <Text style={styles.reportText}>가족에게 알리기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
    ...Shadow.card,
  },
  icon: {
    fontSize: FontSize.headingLarge,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    lineHeight: LineHeight.heading,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    justifyContent: "center",
  },
  labelChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  labelText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dismissButton: {
    flex: 1,
    minHeight: TouchSize.minimum,
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.buttonLabel,
    lineHeight: LineHeight.buttonLabel,
  },
  reportButton: {
    flex: 2,
    minHeight: TouchSize.minimum,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  reportText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.buttonLabel,
    lineHeight: LineHeight.buttonLabel,
    color: Colors.surface,
  },
});
