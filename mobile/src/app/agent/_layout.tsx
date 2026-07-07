import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import {
  ListFilter,
  ShieldCheck,
  FileText,
  Sliders,
} from "lucide-react-native";

export default function AgentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#09090b",
          borderTopColor: "#1e1e24",
          height: Platform.OS === "ios" ? 84 : 72,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#ef4444", // agent dashboard accent colors is danger/destructive red
        tabBarInactiveTintColor: "#52525b",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Attacks Queue",
          tabBarIcon: ({ color, size }) => <ListFilter size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approval"
        options={{
          title: "Policies",
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: "Audits",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="risk"
        options={{
          title: "Risk Engine",
          tabBarIcon: ({ color, size }) => <Sliders size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
