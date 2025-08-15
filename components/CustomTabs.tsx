import { spacingX, spacingY } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";
import Typo from "./Typo";

const CustomTabs = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const iconColor = isFocused ? "#8b5cf6" : "#71717a"; // Purple for active, neutral for inactive
    const iconSize = 24;

    switch (routeName) {
      case "index":
        return (
          <Ionicons
            name={isFocused ? "home" : "home-outline"}
            size={iconSize}
            color={iconColor}
          />
        );
      case "progress":
        return (
          <Ionicons
            name={isFocused ? "trending-up" : "trending-up-outline"}
            size={iconSize}
            color={iconColor}
          />
        );
      case "profile":
        return (
          <Ionicons
            name={isFocused ? "person" : "person-outline"}
            size={iconSize}
            color={iconColor}
          />
        );
      default:
        return (
          <Ionicons name="ellipse-outline" size={iconSize} color={iconColor} />
        );
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case "index":
        return "Home";
      case "progress":
        return "Progress";
      case "profile":
        return "Profile";
      default:
        return routeName;
    }
  };

  const DottedSeparator = () => (
    <View style={styles.separatorContainer}>
      <Svg height="40" width="2" style={styles.separator}>
        <Line
          x1="1"
          y1="0"
          x2="1"
          y2="40"
          stroke="#52525b" // Slightly lighter gray for better visibility
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      </Svg>
    </View>
  );

  return (
    <View style={[styles.floatingContainer, { bottom: insets.bottom + 20 }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <React.Fragment key={route.key}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.tabButton, isFocused && styles.activeTab]}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {getTabIcon(route.name, isFocused)}
                </View>
                <Typo
                  size={12}
                  color={isFocused ? "#8b5cf6" : "#71717a"}
                  fontWeight={isFocused ? "600" : "400"}
                  style={styles.tabLabel}
                >
                  {getTabLabel(route.name)}
                </Typo>
              </TouchableOpacity>

              {/* Add dotted separator between tabs (except after the last tab) */}
              {index < state.routes.length - 1 && <DottedSeparator />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

export default CustomTabs;

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 15, 35, 0.95)", // Much darker background
    borderRadius: 25,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2, // Thicker border
    borderColor: "rgba(139, 92, 246, 0.4)", // Purple border matching your theme
    width: "85%",
    maxWidth: 300,
    // Add backdrop blur effect
    backdropFilter: "blur(20px)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._8,
    borderRadius: 16,
    marginHorizontal: spacingX._3,
  },
  activeTab: {
    backgroundColor: "rgba(139, 92, 246, 0.3)", // Darker purple active state
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.6)",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  iconContainer: {
    marginBottom: spacingY._4,
  },
  tabLabel: {
    textAlign: "center",
  },
  separatorContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 2,
  },
  separator: {
    alignSelf: "center",
  },
});
