import { useRef, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Animated } from "react-native";
import { Colors, TouchSize } from "./tokens";

interface Props {
  isListening: boolean;
  onPress: () => void;
}

export function LargeMicrophoneButton({ isListening, onPress }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isListening, pulse]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          style={[styles.button, isListening && styles.buttonActive]}
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityLabel={isListening ? "듣는 중, 탭하면 중지" : "말하기 버튼"}
          accessibilityRole="button"
        >
          <Text style={styles.icon}>{isListening ? "🔴" : "🎙️"}</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.label}>
        {isListening ? "듣고 있어요…" : "눌러서 말하기"}
      </Text>
    </View>
  );
}

const SIZE = TouchSize.microphone;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 12,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.navyDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonActive: {
    backgroundColor: Colors.danger,
  },
  icon: {
    fontSize: 52,
  },
  label: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
