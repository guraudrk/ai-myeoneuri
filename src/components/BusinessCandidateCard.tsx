import { TouchableOpacity, Text, StyleSheet, View, Linking } from "react-native";
import { Colors, FontSize, Spacing, Shadow, Radius } from "./tokens";
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
  pc: "🖥", 노래: "🎤", 세차: "🚗", 주유: "⛽",
};

function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return "🏪";
}

export function BusinessCandidateCard({ business, onPress }: Props) {
  const emoji = getCategoryEmoji(business.category);

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.card]}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityLabel={`${business.name}, ${business.phone || "전화번호 없음"}, 탭해서 전화`}
      accessibilityRole="button"
    >
      {/* ── 헤더: 아이콘 + 이름 + 거리 ── */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>{emoji}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
          <Text style={styles.category} numberOfLines={1}>{business.category}</Text>
        </View>
        {business.distance && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{business.distance}</Text>
          </View>
        )}
      </View>

      {/* ── 주소 ── */}
      <Text style={styles.address} numberOfLines={1}>📍  {business.address}</Text>

      {/* ── 전화번호 블록 (Toss-style 강조) ── */}
      <View style={styles.phoneBlock}>
        <View style={styles.phoneRow}>
          <Text style={styles.phoneIcon}>📞</Text>
          <Text style={styles.phoneNumber} numberOfLines={1}>
            {business.phone || "전화번호 없음"}
          </Text>
        </View>
        {business.placeUrl ? (
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(business.placeUrl!);
            }}
            accessibilityLabel="카카오맵에서 보기"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.mapBtnText}>🗺{"\n"}지도</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── 탭 유도 바 ── */}
      <View style={styles.callBar}>
        <Text style={styles.callBarText}>탭하면 전화 연결   ›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },

  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  iconEmoji: { fontSize: 24 },
  nameBlock: { flex: 1, gap: 3 },
  name: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  category: {
    fontSize: FontSize.label,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 14,
    color: Colors.primaryDeep,
    fontWeight: "700",
  },

  // 주소
  address: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    lineHeight: 22,
  },

  // 전화번호 블록
  phoneBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  phoneRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phoneIcon: { fontSize: 20 },
  phoneNumber: {
    fontSize: FontSize.phone,
    fontWeight: "800",
    color: Colors.primaryDeep,
    letterSpacing: 0.5,
    flex: 1,
  },
  mapBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    minWidth: 48,
  },
  mapBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },

  // 탭 유도 바
  callBar: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  callBarText: {
    fontSize: FontSize.caption,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
