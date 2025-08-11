import { colors } from "@/constants/theme";
import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral900 },
        // animation options: "default", "fade", "slide_from_right", "slide_from_left", "slide_from_bottom", "none"
        animation: "fade",
      }}
    />
  );
}
