import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/components/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: boolean, active: IoniconsName, inactive: IoniconsName) {
  return ({ color }: { color: string }) => (
    <Ionicons name={focused ? active : inactive} size={26} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor:  Colors.surface,
          borderTopWidth:   1,
          borderTopColor:   Colors.border,
          height:           72,
          paddingBottom:    12,
          paddingTop:       8,
        },
        tabBarLabelStyle: {
          fontSize:    12,
          fontFamily:  "Pretendard-Medium",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, "home", "home-outline")({ color }),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "즐겨찾기",
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, "star", "star-outline")({ color }),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "기록",
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, "time", "time-outline")({ color }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "설정",
          tabBarIcon: ({ color, focused }) =>
            tabIcon(focused, "settings", "settings-outline")({ color }),
        }}
      />
    </Tabs>
  );
}
