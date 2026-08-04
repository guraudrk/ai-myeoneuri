import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, TouchSize, Spacing, Shadow, Radius } from "./tokens";
import type { ContactCandidate } from "@/domain/types";

interface Props {
  candidate: ContactCandidate;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationPanel({ candidate, onConfirm, onCancel }: Props) {
  const initial = candidate.name.charAt(0);

  return (
    <View style={[styles.card, Shadow.card]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{candidate.name}</Text>
      <Text style={styles.question}>지금 전화할까요?</Text>

      <TouchableOpacity
        style={[styles.confirmButton, Shadow.button]}
        onPress={onConfirm}
        activeOpacity={0.85}
        accessibilityLabel="전화 확인"
        accessibilityRole="button"
      >
        <Text style={styles.confirmIcon}>📞</Text>
        <Text style={styles.confirmText}>전화할게요</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        activeOpacity={0.75}
        accessibilityLabel="전화 취소"
        accessibilityRole="button"
      >
        <Text style={styles.cancelText}>전화하지 않을게요</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.primary,
  },
  name: {
    fontSize: FontSize.headingLarge,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  question: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    minHeight: TouchSize.minimum,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  confirmIcon: {
    fontSize: 20,
  },
  confirmText: {
    color: Colors.surface,
    fontSize: FontSize.buttonLabel,
    fontWeight: "700",
  },
  cancelButton: {
    borderRadius: Radius.pill,
    minHeight: TouchSize.minimum,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: "500",
  },
});
