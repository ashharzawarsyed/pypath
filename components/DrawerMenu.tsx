import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
    { icon: "settings-outline", title: "Settings" },
    { icon: "language-outline", title: "Select Language" },
    { icon: "star-outline", title: "Rate Us" },
    { icon: "share-social-outline", title: "Follow Us" },
    { icon: "library-outline", title: "More Courses" },
    { icon: "moon-outline", title: "Dark Mode" },
  ];

  const handleMenuItemPress = (title: string) => {
    console.log(`Pressed: ${title}`);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Simple backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Simple drawer */}
      <View style={[styles.drawer, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Typo size={20} fontWeight="600" color={colors.white}>
            Menu
          </Typo>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={30} color={colors.white} />
            </View>
            <Typo size={18} fontWeight="600" color={colors.white}>
              {user?.name || "User"}
            </Typo>
            <Typo size={14} color={colors.neutral300}>
              {user?.email || "user@example.com"}
            </Typo>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.title)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Typo size={16} color={colors.white} style={styles.menuText}>
                  {item.title}
                </Typo>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.neutral400}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typo size={12} color={colors.neutral400}>
              PyPath v1.0.0
            </Typo>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default DrawerMenu;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawer: {
    width: width * 0.75,
    backgroundColor: "#1a1a2e",
    borderLeftWidth: 2,
    borderLeftColor: "rgba(163, 230, 53, 0.3)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    padding: spacingX._5,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: spacingY._25,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: spacingY._20,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  menuContainer: {
    paddingVertical: spacingY._10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._10,
    marginBottom: spacingY._5,
    borderRadius: radius._10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(163, 230, 53, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._15,
  },
  menuText: {
    flex: 1,
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacingY._30,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    marginTop: spacingY._20,
  },
});
