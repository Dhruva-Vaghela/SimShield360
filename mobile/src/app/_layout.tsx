import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { useBackendSync } from "@/hooks/useBackendSync";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Trigger background polling sync
  useBackendSync();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide splash screen once root is mounted
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style="light" translucent={false} backgroundColor="#09090b" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#09090b" }, // dark theme background by default
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="simulator" />
        <Stack.Screen name="customer" />
        <Stack.Screen name="agent" />
      </Stack>
    </>
  );
}
