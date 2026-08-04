import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, TouchSize, Spacing } from "./tokens";
import type { ContactCandidate } from "@/domain/types";

interface Props {
  candidate: ContactCandidate;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationPanel({ candidate, onConfirm, onCancel }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>
        {candidate.name} 님에게{"\n"}지금 전화할까요?
      </Text>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={onConfirm}
        activeOpacity={0.8}
        accessibilityLabel="전화 확인"
        accessibilityRole="button"
      >
        <Text style={styles.confirmText}>전화할게요</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        activeOpacity={0.8}
        accessibilityLabel="전화 취소"
        accessibilityRole="button"
      >
        <Text style={styles.cancelText}>전화하지 않을게요</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.md,
  },
  heading: {
    fontSize: FontSize.headingLarge,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 40,
    textAlign: "center",
    paddingBottom: Spacing.sm,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  confirmText: {
    color: Colors.surface,
    fontSize: FontSize.buttonLabel,
    fontWeight: "700",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    minHeight: TouchSize.minimum,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.buttonLabel,
    fontWeight: "600",
  },
});
