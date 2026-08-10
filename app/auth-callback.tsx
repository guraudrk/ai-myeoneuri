import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Colors } from "@/components/tokens";

// 구글 OAuth 리다이렉트 수신 라우트.
// 실제 code 교환은 _layout.tsx의 Linking.addEventListener에서 처리한다.
export default function AuthCallback() {
  return (
    <View style={s.root}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
});
