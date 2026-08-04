import { useRef, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, TouchSize, Shadow } from "./tokens";

interface Props {
  isListening: boolean;
  onPress: () => void;
}

const SIZE = TouchSize.microphone;
const GLOW = SIZE + 52;

export function LargeMicrophoneButton({ isListening, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.07, duration: 650, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.65, duration: 650, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.2, duration: 650, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      scale.stopAnimation();
      glowOpacity.stopAnimation();
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.15, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [isListening, scale, glowOpacity]);

  const bgColor = isListening ? Colors.danger : Colors.primary;
  const glowColor = isListening ? Colors.danger : Colors.primary;

  return (
    <View style={styles.wrapper}>
      <View style={styles.glowWrapper}>
        <Animated.View
          style={[styles.glow, { backgroundColor: glowColor, opacity: glowOpacity }]}
        />
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: bgColor }, Shadow.mic]}
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityLabel={isListening ? "듣는 중, 탭하면 중지" : "말하기 버튼"}
            accessibilityRole="button"
          >
            <Ionicons
              name={isListening ? "stop-circle" : "mic"}
              size={58}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
      <Text style={styles.label}>
        {isListening ? "듣고 있어요…" : "눌러서 말하기"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 18,
  },
  glowWrapper: {
    width: GLOW,
    height: GLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 17,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
