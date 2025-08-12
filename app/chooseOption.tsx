import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OPTIONS = [
  { id: "1", label: "Learn Python" },
  { id: "2", label: "Build Projects" },
  { id: "3", label: "Prepare for Jobs" },
  { id: "4", label: "Improve Skills" },
  { id: "5", label: "Practice Coding" },
  { id: "6", label: "Explore AI/ML" },
];

const ChooseOption = () => {
  const { markOnboardingComplete } = useAuth();
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const toggleOption = (id: string) => {
    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter((opt) => opt !== id));
    } else {
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  const handleContinue = async () => {
    try {
      console.log("Selected options before saving:", selectedOptions);

      // Save selected options to AsyncStorage
      await AsyncStorage.setItem(
        "selectedOptions",
        JSON.stringify(selectedOptions)
      );

      // Verify the data was saved
      const savedOptions = await AsyncStorage.getItem("selectedOptions");
      console.log("Verified saved options in AsyncStorage:", savedOptions);

      // Mark onboarding as complete
      markOnboardingComplete();
      router.push("/(auth)/welcome");
    } catch (error) {
      console.error("Error saving selected options:", error);
      // Still continue even if storage fails
      markOnboardingComplete();
      router.push("/(auth)/welcome");
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <Typo
          size={24}
          fontWeight="700"
          style={styles.headerText}
          color={colors.white}
        >
          What brings you here?
        </Typo>
        <Typo size={16} color={colors.textLight} style={styles.subtitleText}>
          Select one or more options to personalize your experience
        </Typo>

        <FlatList
          data={OPTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedOptions.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => toggleOption(item.id)}
                activeOpacity={0.8}
              >
                <Typo
                  size={16}
                  fontWeight="500"
                  color={isSelected ? colors.neutral900 : colors.white}
                >
                  {item.label}
                </Typo>
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={24}
                  color={isSelected ? colors.neutral900 : colors.neutral400}
                />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        <Button
          onPress={handleContinue}
          style={{
            ...styles.button,
            opacity: selectedOptions.length ? 1 : 0.5,
          }}
          disabled={selectedOptions.length === 0}
        >
          <Typo size={18} color={colors.neutral900} fontWeight="600">
            Continue
          </Typo>
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default ChooseOption;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._25,
    paddingTop: spacingY._30,
  },
  headerText: {
    textAlign: "center",
    marginBottom: spacingY._10,
  },
  subtitleText: {
    marginBottom: spacingY._30,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.neutral600,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    borderRadius: 12,
    marginBottom: spacingY._12,
    backgroundColor: colors.neutral800,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  listContainer: {
    paddingBottom: spacingY._40,
  },
  button: {
    width: "100%",
    marginTop: "auto",
    marginBottom: spacingY._20,
  },
});
