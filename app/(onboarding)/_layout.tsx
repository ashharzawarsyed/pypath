import { colors } from "@/constants/theme";
import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral900 },
        animation: "none", // Remove animation to prevent flash
      }}
    />
  );
}
