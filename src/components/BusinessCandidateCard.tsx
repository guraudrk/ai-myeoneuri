import { TouchableOpacity, Text, StyleSheet, View, Linking } from "react-native";
import { Colors, FontSize, TouchSize, Spacing, Shadow, Radius } from "./tokens";
import type { BusinessCandidate } from "@/features/business/BusinessSearchAdapter";

interface Props {
  business: BusinessCandidate;
  onPress: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  치킨: "🍗", 피자: "🍕", 카페: "☕", 병원: "🏥", 약국: "💊",
  치과: "🦷", 한의원: "🌿", 안과: "👁", 마트: "🛒", 편의점: "🏪",
  미용: "💇", 이발: "✂️", 세탁: "👕", 고기: "🥩", 삼겹살: "🥓",
  족발: "🍖", 보쌈: "🥬", 냉면: "🍜", 국밥: "🍲", 식당: "🍽",
  음식점: "🍽", 중국: "🥡", 일식: "🍱", 분식: "🍢", 떡볶이: "🌶",
};

function getCategoryEmoji(category: string): string {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (category.includes(key)) return emoji;
  }
  return "🏪";
}

export function BusinessCandidateCard({ business, onPress }: Props) {
  const emoji = getCategoryEmoji(business.category);

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.card]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${business.name}에 전화`}
      accessibilityRole="button"
    >
      {/* 헤더 행: 이모지 + 이름 + 거리 */}
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>{emoji}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
          <Text style={styles.category}>{business.category}</Text>
        </View>
        {business.distance && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{business.distance}</Text>
          </View>
        )}
      </View>

      {/* 주소 */}
      <Text style={styles.address} numberOfLines={1}>📍 {business.address}</Text>

      {/* 하단 행: 전화번호 + 지도 링크 */}
      <View style={styles.footerRow}>
        {business.phone ? (
          <Text style={styles.phone}>📞 {business.phone}</Text>
        ) : (
          <Text style={styles.noPhone}>전화번호 없음</Text>
        )}
        {business.placeUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(business.placeUrl!)}
            accessibilityLabel="카카오맵에서 보기"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.mapLink}>🗺 지도 보기</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 탭 안내 */}
      <View style={styles.callHint}>
        <Text style={styles.callHintText}>탭하면 전화 연결 →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 22,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  category: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  distanceBadge: {
    backgroundColor: Colors.primaryTint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexShrink: 0,
  },
  distanceText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
  },
  address: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingLeft: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  phone: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  noPhone: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  mapLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
  },
  callHint: {
    alignItems: "flex-end",
  },
  callHintText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
});
