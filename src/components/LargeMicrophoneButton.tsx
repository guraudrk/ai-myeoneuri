import { useRef, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
  ActivityIndicator,
  Vibration,
} from "react-native";
import { Colors, TouchSize, FontSize } from "./tokens";

// 진동 패턴: 상태별 피드백
const HAPTIC: Record<string, number[]> = {
  startListening: [0, 60],
  stopListening:  [0, 40],
  error:          [0, 80, 60, 80],
};

export type MicState = "idle" | "listening" | "processing" | "error";

interface Props {
  micState?: MicState;
  /** 하위 호환: micState 없을 때 isListening 사용 */
  isListening?: boolean;
  isProcessing?: boolean;
  hasError?: boolean;
  onPress: () => void;
}

const SIZE = TouchSize.microphone;

function MicIcon({ color = "#FFF" }: { color?: string }) {
  return (
    <View style={icn.wrapper}>
      <View style={[icn.capsule, { backgroundColor: color }]} />
      <View style={[icn.stand,   { backgroundColor: color }]} />
      <View style={[icn.base,    { backgroundColor: color }]} />
    </View>
  );
}

function StopIcon() {
  return <View style={icn.stop} />;
}

function WarningIcon() {
  return (
    <View style={icn.warningWrap}>
      <Text style={icn.warningText}>!</Text>
    </View>
  );
}

const icn = StyleSheet.create({
  wrapper:     { alignItems: "center", gap: 5 },
  capsule:     { width: 26, height: 42, borderRadius: 13 },
  stand:       { width: 2,  height: 16, borderRadius: 1 },
  base:        { width: 34, height: 2,  borderRadius: 1 },
  stop:        { width: 28, height: 28, borderRadius: 5, backgroundColor: "#FFF" },
  warningWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: "#FFF", alignItems: "center", justifyContent: "center" },
  warningText: { color: "#FFF", fontSize: 22, fontWeight: "800", lineHeight: 28 },
});

export function LargeMicrophoneButton({
  micState,
  isListening = false,
  isProcessing = false,
  hasError = false,
  onPress,
}: Props) {
  // 하위 호환: micState가 명시되면 우선, 아니면 props로 계산
  const state: MicState =
    micState ??
    (isProcessing ? "processing" : hasError ? "error" : isListening ? "listening" : "idle");

  const scale    = useRef(new Animated.Value(1)).current;
  const ring1    = useRef(new Animated.Value(1)).current;
  const ring1Op  = useRef(new Animated.Value(0)).current;
  const ring2    = useRef(new Animated.Value(1)).current;
  const ring2Op  = useRef(new Animated.Value(0)).current;
  const errorPulse = useRef(new Animated.Value(1)).current;

  const prevState = useRef<MicState>("idle");

  useEffect(() => {
    const prev = prevState.current;
    prevState.current = state;

    // 진동 피드백
    if (state === "listening" && prev !== "listening") {
      Vibration.vibrate(HAPTIC.startListening);
    } else if (state === "idle" && prev === "listening") {
      Vibration.vibrate(HAPTIC.stopListening);
    } else if (state === "error" && prev !== "error") {
      Vibration.vibrate(HAPTIC.error);
    }

    // 애니메이션 초기화
    const stopAll = () => {
      scale.stopAnimation();
      ring1.stopAnimation();
      ring2.stopAnimation();
      errorPulse.stopAnimation();
    };

    if (state === "listening") {
      // 버튼 미세 스케일
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();

      // 펄스 링 1
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1,   { toValue: 1.6, duration: 900, useNativeDriver: true }),
            Animated.timing(ring1Op, { toValue: 0,   duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ring1,   { toValue: 1,    duration: 0, useNativeDriver: true }),
            Animated.timing(ring1Op, { toValue: 0.4,  duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();

      // 펄스 링 2 (300ms 딜레이)
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ring2,   { toValue: 1.6, duration: 900, useNativeDriver: true }),
              Animated.timing(ring2Op, { toValue: 0,   duration: 900, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(ring2,   { toValue: 1,   duration: 0, useNativeDriver: true }),
              Animated.timing(ring2Op, { toValue: 0.4, duration: 0, useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, 300);

    } else if (state === "error") {
      // 에러: 버튼 흔들기
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.06, duration: 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 80, useNativeDriver: true }),
      ]).start();
      // 에러 테두리 펄스
      Animated.loop(
        Animated.sequence([
          Animated.timing(errorPulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(errorPulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();

    } else {
      stopAll();
      Animated.parallel([
        Animated.timing(scale,    { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(ring1Op,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(ring2Op,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(errorPulse, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        ring1.setValue(1);
        ring2.setValue(1);
      });
    }

    return stopAll;
  }, [state]);

  const btnColor =
    state === "error"      ? Colors.danger :
    state === "listening"  ? "#1D3DBF" :     // 진해진 primary (누른 느낌)
    Colors.primary;

  const ringColor = state === "listening" ? Colors.primary : Colors.danger;

  const labelText =
    state === "listening"  ? "듣고 있어요…" :
    state === "processing" ? "분석 중…" :
    state === "error"      ? "다시 눌러주세요" :
    "눌러서 말하기";

  return (
    <View style={s.wrapper}>
      <View style={[s.arena, { width: SIZE + 80, height: SIZE + 80 }]}>
        {/* 펄스 링 */}
        <Animated.View style={[
          s.ring,
          { width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            backgroundColor: ringColor, opacity: ring1Op, transform: [{ scale: ring1 }] },
        ]} />
        <Animated.View style={[
          s.ring,
          { width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            backgroundColor: ringColor, opacity: ring2Op, transform: [{ scale: ring2 }] },
        ]} />

        {/* 에러 테두리 링 */}
        {state === "error" && (
          <Animated.View style={[
            s.errorRing,
            { width: SIZE + 12, height: SIZE + 12, borderRadius: (SIZE + 12) / 2,
              transform: [{ scale: errorPulse }] },
          ]} />
        )}

        {/* 버튼 본체 */}
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[
              s.button,
              { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: btnColor },
              state === "error" && s.errorBorder,
            ]}
            onPress={onPress}
            activeOpacity={0.82}
            disabled={state === "processing"}
            accessibilityLabel={
              state === "listening"  ? "듣는 중, 탭하면 중지" :
              state === "processing" ? "분석 중, 잠시 기다려 주세요" :
              state === "error"      ? "오류 발생, 다시 말하기" :
              "말하기 버튼"
            }
            accessibilityRole="button"
          >
            {state === "processing" ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : state === "error" ? (
              <WarningIcon />
            ) : state === "listening" ? (
              <StopIcon />
            ) : (
              <MicIcon />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={[s.label, state === "error" && s.labelError]}>
        {labelText}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 16 },
  arena: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute" },
  errorRing: {
    position: "absolute",
    borderWidth: 3,
    borderColor: Colors.danger,
    backgroundColor: "transparent",
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1939B7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 16,
  },
  errorBorder: {
    borderWidth: 3,
    borderColor: Colors.danger,
  },
  label: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: "500",
    letterSpacing: 0.3,
    fontFamily: "Pretendard-Medium",
  },
  labelError: { color: Colors.danger },
});
