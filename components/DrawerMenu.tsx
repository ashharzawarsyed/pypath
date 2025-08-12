import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInLeft, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const DrawerMenu = ({ visible, onClose }: DrawerMenuProps) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const menuItems = [
    { icon: "settings-outline", title: "Settings", onPress: () => {} },
    { icon: "language-outline", title: "Select Language", onPress: () => {} },
    { icon: "star-outline", title: "Rate Us", onPress: () => {} },
    { icon: "share-social-outline", title: "Follow Us", onPress: () => {} },
    { icon: "library-outline", title: "More Courses", onPress: () => {} },
    { icon: "moon-outline", title: "Dark Mode", onPress: () => {} },
  ];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />

        <Animated.View
          entering={FadeInLeft.duration(300)}
          exiting={FadeOutLeft.duration(300)}
          style={[styles.drawer, { paddingTop: insets.top + 20 }]}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={30} color={colors.neutral600} />
                </View>
              )}
            </View>
            <Typo
              size={18}
              fontWeight="600"
              color={colors.white}
              style={styles.userName}
            >
              {user?.name || "User"}
            </Typo>
            <Typo size={14} color={colors.textLight} style={styles.userEmail}>
              {user?.email}
            </Typo>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
                accessible
                accessibilityLabel={item.title}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={colors.textLight}
                />
                <Typo
                  size={16}
                  color={colors.textLight}
                  style={styles.menuText}
                >
                  {item.title}
                </Typo>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.neutral600}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default DrawerMenu;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    width: width * 0.8,
    backgroundColor: colors.neutral800,
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._20,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: spacingY._30,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
    marginBottom: spacingY._20,
  },
  profileImageContainer: {
    marginBottom: spacingY._15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral700,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    marginBottom: spacingY._5,
  },
  userEmail: {
    textAlign: "center",
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._10,
    borderRadius: radius._10,
    marginBottom: spacingY._5,
  },
  menuText: {
    flex: 1,
    marginLeft: spacingX._15,
  },
});
