import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import {
  getCourseProgress,
  getUserEnrolledCourses,
} from "@/utils/courseService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

type UserStats = {
  totalCourses: number;
  completedCourses: number;
  overallProgress: number;
};

const DrawerMenu = ({ visible, onClose }: DrawerMenuProps) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalCourses: 0,
    completedCourses: 0,
    overallProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && user?.uid) {
      loadUserStats();
    }
  }, [visible, user?.uid]);

  const loadUserStats = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const enrolledCourses = await getUserEnrolledCourses(user.uid);

      let totalProgress = 0;
      let completedCount = 0;

      for (const course of enrolledCourses) {
        const progress = await getCourseProgress(user.uid, course.id);
        totalProgress += progress;

        if (progress >= 100) {
          completedCount++;
        }
      }

      const overallProgress =
        enrolledCourses.length > 0
          ? Math.round(totalProgress / enrolledCourses.length)
          : 0;

      setStats({
        totalCourses: enrolledCourses.length,
        completedCourses: completedCount,
        overallProgress,
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            const { signOut } = await import("firebase/auth");
            const { auth } = await import("@/config/firebase");
            await signOut(auth);
            onClose();
            router.replace("/(auth)/welcome");
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: "profile",
      title: "My Profile",
      icon: "person-outline",
      color: "#8b5cf6",
      onPress: () => {
        onClose();
        router.push("/(tabs)/profile");
      },
    },
    {
      id: "progress",
      title: "My Progress",
      icon: "trending-up-outline",
      color: "#10b981",
      onPress: () => {
        onClose();
        router.push("/(tabs)/progress");
      },
    },
    {
      id: "certificates",
      title: "Certificates",
      icon: "ribbon-outline",
      color: "#f59e0b",
      onPress: () => {
        Alert.alert(
          "Certificates",
          "Your certificates will appear here once you complete courses!"
        );
      },
    },
    {
      id: "downloads",
      title: "Downloads",
      icon: "download-outline",
      color: "#06b6d4",
      onPress: () => {
        Alert.alert("Downloads", "Offline downloads coming soon!");
      },
    },
    {
      id: "settings",
      title: "Settings",
      icon: "settings-outline",
      color: "#6b7280",
      onPress: () => {
        Alert.alert("Settings", "Settings coming soon!");
      },
    },
    {
      id: "language",
      title: "Language",
      icon: "language-outline",
      color: "#8b5cf6",
      onPress: () => {
        Alert.alert("Language", "Language selection coming soon!");
      },
    },
    {
      id: "help",
      title: "Help & Support",
      icon: "help-circle-outline",
      color: "#10b981",
      onPress: () => {
        Alert.alert("Help & Support", "Contact us at support@pypath.com");
      },
    },
    {
      id: "rate",
      title: "Rate Us",
      icon: "star-outline",
      color: "#f59e0b",
      onPress: () => {
        Alert.alert("Rate Us", "Thank you! Rating feature coming soon.");
      },
    },
    {
      id: "follow",
      title: "Follow Us",
      icon: "logo-twitter",
      color: "#3b82f6",
      onPress: () => {
        Alert.alert("Follow Us", "Social media links coming soon!");
      },
    },
    {
      id: "signout",
      title: "Sign Out",
      icon: "log-out-outline",
      color: "#ef4444",
      onPress: handleSignOut,
      isDestructive: true,
    },
  ];

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Drawer - slides from LEFT to middle of screen */}
      <View style={[styles.drawer, { paddingTop: insets.top + 20 }]}>
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f172a"]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <LinearGradient
                colors={["#8b5cf6", "#6366f1", "#a855f7"]}
                style={styles.avatarContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person" size={32} color={colors.white} />
              </LinearGradient>

              <View style={styles.userInfo}>
                <Typo size={20} fontWeight="600" color={colors.white}>
                  {user?.name || "User"}
                </Typo>
                <Typo size={14} color="rgba(255, 255, 255, 0.7)">
                  {user?.email || "user@example.com"}
                </Typo>
              </View>

              {/* User stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Typo size={18} fontWeight="600" color="#8b5cf6">
                    {loading ? "..." : stats.totalCourses}
                  </Typo>
                  <Typo size={12} color="rgba(255, 255, 255, 0.6)">
                    Courses
                  </Typo>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Typo size={18} fontWeight="600" color="#10b981">
                    {loading ? "..." : stats.completedCourses}
                  </Typo>
                  <Typo size={12} color="rgba(255, 255, 255, 0.6)">
                    Completed
                  </Typo>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Typo size={18} fontWeight="600" color="#f59e0b">
                    {loading ? "..." : `${stats.overallProgress}%`}
                  </Typo>
                  <Typo size={12} color="rgba(255, 255, 255, 0.6)">
                    Progress
                  </Typo>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              <Typo
                size={14}
                fontWeight="600"
                color="rgba(255, 255, 255, 0.6)"
                style={styles.sectionTitle}
              >
                MENU
              </Typo>

              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    item.isDestructive && styles.destructiveMenuItem,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[`${item.color}20`, `${item.color}10`]}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </LinearGradient>

                  <Typo
                    size={16}
                    color={item.isDestructive ? "#ef4444" : colors.white}
                    style={styles.menuText}
                  >
                    {item.title}
                  </Typo>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255, 255, 255, 0.4)"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <LinearGradient
                colors={["rgba(139, 92, 246, 0.1)", "rgba(99, 102, 241, 0.05)"]}
                style={styles.footerGradient}
              >
                <Ionicons name="logo-python" size={20} color="#8b5cf6" />
                <Typo size={12} color="rgba(255, 255, 255, 0.6)">
                  Version 1.0.0
                </Typo>
              </LinearGradient>
            </View>
          </ScrollView>
        </LinearGradient>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: "0%", // 0% from top
    bottom: "5%", // 5% from bottom
    width: width * 0.9, // 90% width
    borderTopLeftRadius: 30, // Added top-left rounded corner
    borderTopRightRadius: 30, // Added top-right rounded corner
    borderBottomLeftRadius: 30, // Keep bottom-left rounded corner
    borderBottomRightRadius: 30, // Keep bottom-right rounded corner
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 25,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20, // Added top padding since we removed header
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: spacingY._25,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.2)",
    marginBottom: spacingY._25,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacingY._15,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: spacingY._20,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: spacingX._15,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
    marginLeft: spacingX._5,
  },
  menuContainer: {
    paddingVertical: spacingY._10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._15,
    marginBottom: spacingY._7,
    borderRadius: radius._15,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.15)",
  },
  destructiveMenuItem: {
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._15,
  },
  menuText: {
    flex: 1,
    fontWeight: "500",
  },
  footer: {
    marginTop: spacingY._20,
    marginBottom: spacingY._30,
  },
  footerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._15,
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    gap: spacingX._10,
  },
});
