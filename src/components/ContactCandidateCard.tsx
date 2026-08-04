import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Colors, FontSize, TouchSize, Spacing, Shadow, Radius } from "./tokens";
import type { ContactCandidate } from "@/domain/types";

interface Props {
  candidate: ContactCandidate;
  onPress: () => void;
}

export function ContactCandidateCard({ candidate, onPress }: Props) {
  const initial = candidate.name.charAt(0);

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.card]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${candidate.name}에게 전화`}
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{candidate.name}</Text>
        <Text style={styles.number}>{candidate.maskedNumber}</Text>
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TouchSize.minimum + 12,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  number: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  arrow: {
    flexShrink: 0,
  },
  arrowText: {
    fontSize: 28,
    color: Colors.textMuted,
    fontWeight: "300",
  },
});
