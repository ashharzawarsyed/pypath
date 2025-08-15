import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

const Progress = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Typo size={28} fontWeight="800" style={styles.heading}>
          Progress
        </Typo>
        <View style={styles.content}>
          <Typo size={16} color={colors.textLight}>
            Your learning progress and achievements will be displayed here.
          </Typo>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Progress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
  },
  heading: {
    color: colors.white,
    marginBottom: spacingY._25,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
