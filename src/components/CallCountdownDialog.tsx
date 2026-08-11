import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from "react-native";
import { Colors, FontFamily, FontSize, Spacing, Radius, TouchSize } from "@/components/tokens";

interface Props {
  contactName: string;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SECONDS = 3;

export function CallCountdownDialog({ contactName, visible, onConfirm, onCancel }: Props) {
  const [count, setCount] = useState(SECONDS);
  const progress = useRef(new Animated.Value(1)).current;
  const confirmed = useRef(false);

  useEffect(() => {
    if (!visible) return;
    confirmed.current = false;
    setCount(SECONDS);
    progress.setValue(1);

    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: SECONDS * 1000,
      useNativeDriver: false,
    });
    anim.start();

    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(interval);
          if (!confirmed.current) {
            confirmed.current = true;
            onConfirm();
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      anim.stop();
      clearInterval(interval);
    };
  }, [visible]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const initial = contactName.trim()[0] ?? "?";

  function handleCancel() {
    confirmed.current = true; // 중복 onConfirm 방지
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* 아바타 */}
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>

          {/* 이름 */}
          <Text style={s.name} numberOfLines={1}>{contactName}</Text>
          <Text style={s.sub}>님께 전화합니다</Text>

          {/* 카운트다운 숫자 */}
          <View style={s.countCircle}>
            <Text style={s.countNum}>{count}</Text>
          </View>

          {/* 진행 바 */}
          <View style={s.track}>
            <Animated.View style={[s.bar, { width: barWidth }]} />
          </View>

          {/* 취소 */}
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={handleCancel}
            accessibilityLabel="전화 취소"
          >
            <Text style={s.cancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 38,
    color: "#FFF",
    fontWeight: "700",
    fontFamily: FontFamily.heading,
  },
  name: {
    fontSize: FontSize.headingLarge,
    fontWeight: "800",
    color: Colors.textPrimary,
    fontFamily: FontFamily.heading,
    textAlign: "center",
  },
  sub: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    marginBottom: Spacing.md,
  },
  countCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryTint,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  countNum: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.primary,
    fontFamily: FontFamily.heading,
    fontVariant: ["tabular-nums"],
  },
  track: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  bar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  cancelBtn: {
    width: "100%",
    minHeight: TouchSize.minimum,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: FontSize.body,
    fontWeight: "700",
    color: Colors.danger,
    fontFamily: FontFamily.headingMedium,
  },
});
