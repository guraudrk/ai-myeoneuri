import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, TouchSize, Spacing, Shadow, Radius } from "./tokens";
import type { BusinessCandidate } from "@/features/business/BusinessSearchAdapter";

interface Props {
  business: BusinessCandidate;
  onPress: () => void;
}

export function BusinessCandidateCard({ business, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, Shadow.card]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${business.name}에 전화`}
      accessibilityRole="button"
    >
      <View style={styles.iconBox}>
        <Ionicons name="storefront-outline" size={26} color={Colors.primary} />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
          {business.distance && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{business.distance}</Text>
            </View>
          )}
        </View>
        <Text style={styles.category}>{business.category}</Text>
        <Text style={styles.address} numberOfLines={1}>{business.address}</Text>
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
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: Colors.primaryTint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  distanceText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
  },
  category: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  address: {
    fontSize: 14,
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
