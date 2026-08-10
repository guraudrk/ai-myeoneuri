import { useRef, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Animated } from "react-native";
import { Colors, TouchSize } from "./tokens";

interface Props {
  isListening: boolean;
  onPress: () => void;
}

const SIZE = TouchSize.microphone;

function MicIcon() {
  return (
    <View style={icn.wrapper}>
      <View style={icn.capsule} />
      <View style={icn.stand} />
      <View style={icn.base} />
    </View>
  );
}

function StopIcon() {
  return <View style={icn.stop} />;
}

const icn = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 5 },
  capsule: { width: 26, height: 42, borderRadius: 13, backgroundColor: "#FFFFFF" },
  stand:   { width: 2, height: 16, backgroundColor: "#FFFFFF", borderRadius: 1 },
  base:    { width: 34, height: 2, backgroundColor: "#FFFFFF", borderRadius: 1 },
  stop:    { width: 28, height: 28, backgroundColor: "#FFFFFF", borderRadius: 5 },
});

export function LargeMicrophoneButton({ isListening, onPress }: Props) {
  const scale    = useRef(new Animated.Value(1)).current;
  const ring1    = useRef(new Animated.Value(1)).current;
  const ring1Op  = useRef(new Animated.Value(0)).current;
  const ring2    = useRef(new Animated.Value(1)).current;
  const ring2Op  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // 버튼 자체 미세 스케일
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();

      // 1번 링: 빠르게
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1,   { toValue: 1.55, duration: 900, useNativeDriver: true }),
            Animated.timing(ring1Op, { toValue: 0,    duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ring1,   { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring1Op, { toValue: 0.45, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();

      // 2번 링: 300ms 딜레이 — 레이어드 느낌
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ring2,   { toValue: 1.55, duration: 900, useNativeDriver: true }),
              Animated.timing(ring2Op, { toValue: 0,    duration: 900, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(ring2,   { toValue: 1, duration: 0, useNativeDriver: true }),
              Animated.timing(ring2Op, { toValue: 0.45, duration: 0, useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, 300);
    } else {
      scale.stopAnimation();
      ring1.stopAnimation();
      ring2.stopAnimation();
      Animated.parallel([
        Animated.timing(scale,   { toValue: 1,    duration: 250, useNativeDriver: true }),
        Animated.timing(ring1Op, { toValue: 0,    duration: 200, useNativeDriver: true }),
        Animated.timing(ring2Op, { toValue: 0,    duration: 200, useNativeDriver: true }),
      ]).start(() => {
        ring1.setValue(1);
        ring2.setValue(1);
      });
    }
  }, [isListening]);

  const btnColor  = isListening ? Colors.danger : Colors.primary;
  const ringColor = isListening ? Colors.danger : Colors.primary;

  return (
    <View style={s.wrapper}>
      <View style={s.arena}>
        {/* 펄스 링 2개 */}
        <Animated.View style={[
          s.ring,
          { backgroundColor: ringColor, opacity: ring1Op, transform: [{ scale: ring1 }] },
        ]} />
        <Animated.View style={[
          s.ring,
          { backgroundColor: ringColor, opacity: ring2Op, transform: [{ scale: ring2 }] },
        ]} />

        {/* 버튼 본체 */}
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[s.button, { backgroundColor: btnColor }]}
            onPress={onPress}
            activeOpacity={0.82}
            accessibilityLabel={isListening ? "듣는 중, 탭하면 중지" : "말하기 버튼"}
            accessibilityRole="button"
          >
            {isListening ? <StopIcon /> : <MicIcon />}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={s.label}>
        {isListening ? "듣고 있어요…" : "눌러서 말하기"}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 20 },
  arena: {
    width: SIZE + 80,
    height: SIZE + 80,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E5BFF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
  },
  label: {
    fontSize: 18,
    color: Colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.4,
  },
});
