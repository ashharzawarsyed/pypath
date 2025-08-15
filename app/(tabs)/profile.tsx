import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

const Profile = () => {
  const { user } = useAuth();

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Typo size={28} fontWeight="800" style={styles.heading}>
          Profile
        </Typo>

        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color={colors.neutral600} />
          </View>

          <Typo
            size={20}
            fontWeight="600"
            color={colors.white}
            style={styles.name}
          >
            {user?.name || "User"}
          </Typo>

          <Typo size={14} color={colors.textLight} style={styles.email}>
            {user?.email}
          </Typo>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Profile;

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
  profileContainer: {
    alignItems: "center",
    paddingTop: spacingY._40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.neutral700,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacingY._20,
  },
  name: {
    marginBottom: spacingY._5,
  },
  email: {
    textAlign: "center",
  },
});
