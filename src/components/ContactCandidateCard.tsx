import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, FontSize, TouchSize, Spacing } from "./tokens";
import type { ContactCandidate } from "@/domain/types";

interface Props {
  candidate: ContactCandidate;
  onPress: () => void;
}

export function ContactCandidateCard({ candidate, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${candidate.name}에게 전화`}
      accessibilityRole="button"
    >
      <Text style={styles.name}>{candidate.name}</Text>
      <Text style={styles.number}>{candidate.maskedNumber}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  number: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
