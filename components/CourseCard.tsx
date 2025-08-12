import { colors, spacingX, spacingY } from "@/constants/theme";
import { Course } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Typo from "./Typo";

interface CourseCardProps {
  course: Course;
  enrolled: boolean;
  onPress: () => void;
  style?: any;
}

const CourseCard = React.memo(
  ({ course, enrolled, onPress, style }: CourseCardProps) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.15);

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      shadowOpacity.value = withTiming(0.25, { duration: 150 });
    }, [scale, shadowOpacity]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      shadowOpacity.value = withTiming(0.15, { duration: 150 });
    }, [scale, shadowOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
    }));

    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case "Beginner":
          return ["#10b981", "#34d399"];
        case "Intermediate":
          return ["#f59e0b", "#fbbf24"];
        case "Advanced":
          return ["#ef4444", "#f87171"];
        default:
          return [colors.neutral500, colors.neutral400];
      }
    };

    const getBadgeType = (course: Course) => {
      if (course.isPopular)
        return { text: "TRENDING", colors: ["#8b5cf6", "#a78bfa"] };
      return { text: "NEW", colors: [colors.primary, "#bef264"] };
    };

    const badge = getBadgeType(course);

    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          accessible
          accessibilityLabel={`${course.title} course, ${course.difficulty} level, ${course.duration}`}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={styles.touchable}
        >
          <LinearGradient
            colors={["#2a2d47", "#1e2139", "#16213e"]}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Course Image Thumbnail */}
            <View style={styles.imageContainer}>
              <LinearGradient
                colors={["#6366f1", "#8b5cf6", "#a855f7"]}
                style={styles.imageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* You can add an actual image here later */}
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="code-slash"
                    size={40}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                </View>
              </LinearGradient>

              {/* Badge */}
              <LinearGradient
                colors={[...badge.colors] as [string, string]}
                style={styles.badge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Typo size={10} fontWeight="700" color={colors.white}>
                  {badge.text}
                </Typo>
              </LinearGradient>

              {/* Enrolled Chip */}
              {enrolled && (
                <LinearGradient
                  colors={["#10b981", "#34d399"]}
                  style={styles.enrolledChip}
                >
                  <Typo size={11} fontWeight="600" color={colors.white}>
                    ✓ Enrolled
                  </Typo>
                </LinearGradient>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Typo
                size={18}
                fontWeight="700"
                color={colors.white}
                style={styles.title}
                textProps={{ numberOfLines: 2 }}
              >
                {course.title}
              </Typo>

              <Typo
                size={14}
                color="rgba(255, 255, 255, 0.7)"
                style={styles.description}
                textProps={{ numberOfLines: 2 }}
              >
                {course.description}
              </Typo>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <LinearGradient
                  colors={
                    [...getDifficultyColor(course.difficulty)] as [
                      string,
                      string
                    ]
                  }
                  style={styles.difficultyPill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Typo size={11} fontWeight="600" color={colors.white}>
                    {course.difficulty}
                  </Typo>
                </LinearGradient>

                <View style={styles.metaInfo}>
                  <Typo size={12} color="rgba(255, 255, 255, 0.6)">
                    {course.duration} • {course.lessons} lessons
                  </Typo>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

CourseCard.displayName = "CourseCard";

export default CourseCard;

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.3,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    marginVertical: spacingY._10,
  },
  imageContainer: {
    position: "relative",
    height: 120,
  },
  imageGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enrolledChip: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  content: {
    padding: spacingX._20,
    paddingVertical: spacingY._20,
  },
  title: {
    marginBottom: spacingY._10,
    lineHeight: 24,
  },
  description: {
    marginBottom: spacingY._15,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  difficultyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  metaInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
});
