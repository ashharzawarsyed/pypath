import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, SafeAreaView, StyleSheet, View } from "react-native";
import Swiper from "react-native-swiper";

const { width, height } = Dimensions.get("window");

const Onboarding = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/chooseOption");
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.container}>
        <Swiper
          style={styles.wrapper}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
          loop={false}
          paginationStyle={styles.pagination}
        >
          <View style={styles.slide}>
            <View style={styles.textContainer}>
              <Typo size={24} fontWeight="600" style={styles.text}>
                Trusted by millions of users
              </Typo>
            </View>
          </View>

          <View style={styles.slide}>
            <View style={styles.textContainer}>
              <Typo size={24} fontWeight="600" style={styles.text}>
                Get job ready
              </Typo>
            </View>
          </View>

          <View style={styles.slide}>
            <View style={styles.textContainer}>
              <Typo size={24} fontWeight="600" style={styles.text}>
                Backed by Google experts
              </Typo>
            </View>
          </View>
        </Swiper>

        <View style={styles.buttonContainer}>
          <Button onPress={handleGetStarted} style={styles.button}>
            <Typo size={18} color={colors.neutral900} fontWeight="600">
              Get Started
            </Typo>
          </Button>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {},
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100, // Make space for the button
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
  dot: {
    backgroundColor: colors.neutral600,
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
  },
  activeDot: {
    backgroundColor: colors.white,
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 3,
  },
  pagination: {
    bottom: 120,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: spacingX._25,
  },
  button: {
    width: "100%",
  },
});
