import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Colors, FontSize, TouchSize, Spacing } from "./tokens";
import type { BusinessCandidate } from "@/features/business/BusinessSearchAdapter";

interface Props {
  business: BusinessCandidate;
  onPress: () => void;
}

export function BusinessCandidateCard({ business, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${business.name}에 전화`}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <Text style={styles.name}>{business.name}</Text>
        {business.distance && (
          <Text style={styles.distance}>{business.distance}</Text>
        )}
      </View>
      <Text style={styles.category}>{business.category}</Text>
      <Text style={styles.address}>{business.address}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TouchSize.minimum,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  distance: {
    fontSize: FontSize.caption,
    color: Colors.primary,
    fontWeight: "600",
  },
  category: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  address: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
});
