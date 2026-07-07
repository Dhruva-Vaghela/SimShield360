import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme, Platform } from "react-native";
import {
  LayoutDashboard,
  ShieldAlert,
  FilePlus,
  Smartphone,
  Settings,
} from "lucide-react-native";

export default function CustomerLayout() {
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
        tabBarActiveTintColor: "#0ea5e9",
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
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sim-lock"
        options={{
          title: "SIM Lock",
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: "New Request",
          tabBarIcon: ({ color, size }) => <FilePlus size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          tabBarIcon: ({ color, size }) => <Smartphone size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
