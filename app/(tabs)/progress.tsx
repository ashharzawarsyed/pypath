import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Course } from "@/types";
import {
  getCourseProgress,
  getUserEnrolledCourses,
} from "@/utils/courseService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

type CourseProgress = Course & {
  progress: number;
  enrolled: boolean;
};

type ProgressStats = {
  totalCourses: number;
  completedCourses: number;
  totalLectures: number;
  completedLectures: number;
  overallProgress: number;
  streakDays: number;
  timeSpent: number; // in minutes
};

const ProgressScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    totalCourses: 0,
    completedCourses: 0,
    totalLectures: 0,
    completedLectures: 0,
    overallProgress: 0,
    streakDays: 0,
    timeSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  // Animation values
  const progressAnimation = useSharedValue(0);
  const statsAnimation = useSharedValue(0);
  const achievementPulse = useSharedValue(1);
  const streakAnimation = useSharedValue(0);
  const blobAnimation1 = useSharedValue(0);
  const blobAnimation2 = useSharedValue(0);
  const headerScale = useSharedValue(0.95);

  useEffect(() => {
    if (user?.uid) {
      loadProgressData();
    }
  }, [user?.uid]);

  useEffect(() => {
    // Start animations
    progressAnimation.value = withDelay(
      300,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );

    statsAnimation.value = withDelay(
      600,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) })
    );

    streakAnimation.value = withDelay(
      900,
      withSequence(
        withTiming(1, { duration: 800 }),
        withRepeat(
          withSequence(
            withTiming(1.1, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        )
      )
    );

    achievementPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    blobAnimation1.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    blobAnimation2.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    headerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  const loadProgressData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Get enrolled courses
      const enrolledCourses = await getUserEnrolledCourses(user.uid);

      // Get progress for each course
      const coursesWithProgress: CourseProgress[] = [];
      let totalLectures = 0;
      let completedLectures = 0;

      for (const course of enrolledCourses) {
        const progress = await getCourseProgress(user.uid, course.id);
        coursesWithProgress.push({
          ...course,
          progress: Math.round(progress),
          enrolled: true,
        });

        // Calculate lecture stats based on actual course data
        const courseLectureCount = course.lessons || 0;
        totalLectures += courseLectureCount;
        completedLectures += Math.round((progress / 100) * courseLectureCount);
      }

      setCourses(coursesWithProgress);

      // Calculate overall stats - only based on real data
      const totalProgress = coursesWithProgress.reduce(
        (sum, course) => sum + course.progress,
        0
      );
      const overallProgress =
        coursesWithProgress.length > 0
          ? Math.round(totalProgress / coursesWithProgress.length)
          : 0;

      const completedCourses = coursesWithProgress.filter(
        (course) => course.progress >= 100
      ).length;

      // Calculate actual streak days (you can implement this based on your user activity data)
      const streakDays = await calculateUserStreak(user.uid);

      // Calculate actual time spent (you can implement this based on your user activity data)
      const timeSpent = await calculateTimeSpent(user.uid);

      setStats({
        totalCourses: coursesWithProgress.length,
        completedCourses,
        totalLectures,
        completedLectures,
        overallProgress,
        streakDays,
        timeSpent,
      });
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real streak calculation based on user activity - simplified to avoid index requirements
  const calculateUserStreak = async (userId: string): Promise<number> => {
    try {
      // Get user's progress data from Firestore to calculate streak
      const { firestore } = await import("@/config/firebase");
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );

      const progressRef = collection(firestore, "userProgress");
      const q = query(progressRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return 0;

      // Calculate consecutive days of activity
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activities = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.lastAccessedAt?.toDate() || new Date();
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      });

      // Remove duplicates and sort in descending order (most recent first)
      const uniqueDays = [...new Set(activities)].sort((a, b) => b - a);

      if (uniqueDays.length === 0) return 0;

      // Check if user was active today or yesterday (to allow for different time zones)
      const mostRecentActivity = uniqueDays[0];
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - mostRecentActivity) / (1000 * 60 * 60 * 24)
      );

      // If last activity was more than 1 day ago, streak is broken
      if (daysSinceLastActivity > 1) return 0;

      // Count consecutive days
      for (let i = 0; i < uniqueDays.length; i++) {
        const daysDiff = Math.floor(
          (today.getTime() - uniqueDays[i]) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff === i || (i === 0 && daysDiff <= 1)) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error("Error calculating streak:", error);
      return 0;
    }
  };

  // Real time calculation based on user activity
  const calculateTimeSpent = async (userId: string): Promise<number> => {
    try {
      // This is a simplified calculation - you can enhance based on your tracking needs
      const enrolledCourses = await getUserEnrolledCourses(userId);
      let totalTime = 0;

      for (const course of enrolledCourses) {
        const progress = await getCourseProgress(userId, course.id);
        // Estimate time based on progress and course difficulty
        const baseTime =
          course.difficulty === "Beginner"
            ? 60
            : course.difficulty === "Intermediate"
            ? 90
            : 120; // minutes per course
        totalTime += Math.round((progress / 100) * baseTime);
      }

      return totalTime;
    } catch (error) {
      console.error("Error calculating time spent:", error);
      return 0;
    }
  };

  // Animated styles
  const progressCircleStyle = useAnimatedStyle(() => {
    const scale = interpolate(progressAnimation.value, [0, 1], [0.8, 1]);
    const opacity = interpolate(progressAnimation.value, [0, 1], [0, 1]);
    return { transform: [{ scale }], opacity };
  });

  const statsCardStyle = useAnimatedStyle(() => {
    const translateY = interpolate(statsAnimation.value, [0, 1], [50, 0]);
    const opacity = interpolate(statsAnimation.value, [0, 1], [0, 1]);
    return { transform: [{ translateY }], opacity };
  });

  const achievementStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: achievementPulse.value }] };
  });

  const streakStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: streakAnimation.value }] };
  });

  const headerStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: headerScale.value }] };
  });

  const blob1Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [-30, 50, -30]
    );
    const translateY = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [-20, 30, -20]
    );
    const scale = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [0.8, 1.2, 0.8]
    );
    return { transform: [{ translateX }, { translateY }, { scale }] };
  });

  const blob2Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [40, -30, 40]
    );
    const translateY = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [20, -40, 20]
    );
    const scale = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [1.1, 0.9, 1.1]
    );
    return { transform: [{ translateX }, { translateY }, { scale }] };
  });

  const renderCourseProgressCard = useCallback(
    ({ item, index }: { item: CourseProgress; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 150).springify()}
        style={styles.courseCard}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/CourseContent",
              params: { courseId: item.id },
            })
          }
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[
              item.progress >= 100
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(139, 92, 246, 0.2)",
              item.progress >= 100
                ? "rgba(34, 197, 94, 0.08)"
                : "rgba(99, 102, 241, 0.08)",
            ]}
            style={styles.courseCardGradient}
          >
            <View style={styles.courseCardHeader}>
              <View style={styles.courseInfo}>
                <Typo size={18} fontWeight="700" color={colors.white}>
                  {item.title}
                </Typo>
                <Typo size={14} fontWeight="600" color={colors.neutral300}>
                  {item.difficulty} • {item.lessons} lessons
                </Typo>
              </View>
              <View style={styles.progressBadge}>
                <Typo
                  size={12}
                  fontWeight="700"
                  color={item.progress >= 100 ? colors.green : colors.primary}
                >
                  {item.progress}%
                </Typo>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${item.progress}%`,
                      backgroundColor:
                        item.progress >= 100 ? colors.green : colors.primary,
                    },
                  ]}
                />
              </View>
              {item.progress >= 100 && (
                <View style={styles.completedIconWrapper}>
                  <Animated.View
                    style={[styles.completedIcon, achievementStyle]}
                  >
                    <Ionicons name="trophy" size={16} color={colors.green} />
                  </Animated.View>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    ),
    [router, achievementStyle]
  );

  const CircularProgress = ({
    progress,
    size = 120,
  }: {
    progress: number;
    size?: number;
  }) => {
    const circumference = 2 * Math.PI * (size / 2 - 10);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <Animated.View style={progressCircleStyle}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient
              id="progressGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor="#8fbc8f" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            stroke="rgba(163, 230, 53, 0.3)"
            strokeWidth="8"
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            stroke="url(#progressGrad)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View
          style={[styles.progressTextContainer, { width: size, height: size }]}
        >
          <Typo size={24} fontWeight="900" color={colors.white}>
            {progress}%
          </Typo>
          <Typo size={12} fontWeight="600" color={colors.neutral300}>
            Overall
          </Typo>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#050505", "#0a0a0a", "#080808"]}
          style={styles.gradient}
        />
        <ScreenWrapper style={styles.screenWrapper}>
          <View style={styles.loadingContainer}>
            <Typo size={18} fontWeight="600" color={colors.neutral400}>
              Loading your progress...
            </Typo>
          </View>
        </ScreenWrapper>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#050505", "#0a0a0a", "#080808"]}
        style={styles.gradient}
      />

      {/* Animated background blobs - darker */}
      <Animated.View style={[styles.blob, styles.blob1, blob1Style]}>
        <Svg width="200" height="200" viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="blobGrad1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <Stop
                offset="100%"
                stopColor={colors.primary}
                stopOpacity="0.03"
              />
            </RadialGradient>
          </Defs>
          <Path
            d="M100,20 C140,25 170,55 165,95 C160,135 130,165 90,160 C50,155 20,125 25,85 C30,45 60,15 100,20 Z"
            fill="url(#blobGrad1)"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.blob, styles.blob2, blob2Style]}>
        <Svg width="180" height="180" viewBox="0 0 180 180">
          <Defs>
            <RadialGradient id="blobGrad2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#8fbc8f" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#8fbc8f" stopOpacity="0.03" />
            </RadialGradient>
          </Defs>
          <Path
            d="M90,15 C125,20 150,45 145,80 C140,115 115,140 80,135 C45,130 20,105 25,70 C30,35 55,10 90,15 Z"
            fill="url(#blobGrad2)"
          />
        </Svg>
      </Animated.View>

      <ScreenWrapper style={styles.screenWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInUp.springify()}
            style={[styles.header, headerStyle]}
          >
            <Typo size={32} fontWeight="900" color={colors.white}>
              Your Progress
            </Typo>
            <Typo size={16} fontWeight="600" color={colors.neutral300}>
              {courses.length > 0
                ? `Keep up the great work, ${user?.name}!`
                : `Ready to start learning, ${user?.name}?`}
            </Typo>
          </Animated.View>

          {/* Overall Progress Circle */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.progressSection}
          >
            <CircularProgress progress={stats.overallProgress} />
          </Animated.View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Animated.View
              entering={FadeInLeft.delay(400).springify()}
              style={[styles.statCard, statsCardStyle]}
            >
              <LinearGradient
                colors={["rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.05)"]}
                style={styles.statCardGradient}
              >
                <Ionicons
                  name="trophy-outline"
                  size={24}
                  color={colors.green}
                />
                <Typo size={20} fontWeight="800" color={colors.white}>
                  {stats.completedCourses}
                </Typo>
                <Typo size={12} fontWeight="600" color={colors.neutral300}>
                  Completed
                </Typo>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              entering={FadeInRight.delay(500).springify()}
              style={[styles.statCard, statsCardStyle]}
            >
              <LinearGradient
                colors={[
                  "rgba(139, 92, 246, 0.15)",
                  "rgba(139, 92, 246, 0.05)",
                ]}
                style={styles.statCardGradient}
              >
                <Ionicons
                  name="library-outline"
                  size={24}
                  color={colors.primary}
                />
                <Typo size={20} fontWeight="800" color={colors.white}>
                  {stats.totalCourses}
                </Typo>
                <Typo size={12} fontWeight="600" color={colors.neutral300}>
                  Enrolled
                </Typo>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              entering={FadeInLeft.delay(600).springify()}
              style={[styles.statCard, statsCardStyle]}
            >
              <LinearGradient
                colors={[
                  "rgba(249, 115, 22, 0.15)",
                  "rgba(249, 115, 22, 0.05)",
                ]}
                style={styles.statCardGradient}
              >
                <View style={styles.streakIconWrapper}>
                  <Animated.View style={streakStyle}>
                    <Ionicons name="flame" size={24} color="#f97316" />
                  </Animated.View>
                </View>
                <Typo size={20} fontWeight="800" color={colors.white}>
                  {stats.streakDays}
                </Typo>
                <Typo size={12} fontWeight="600" color={colors.neutral300}>
                  Day Streak
                </Typo>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              entering={FadeInRight.delay(700).springify()}
              style={[styles.statCard, statsCardStyle]}
            >
              <LinearGradient
                colors={[
                  "rgba(168, 85, 247, 0.15)",
                  "rgba(168, 85, 247, 0.05)",
                ]}
                style={styles.statCardGradient}
              >
                <Ionicons name="time-outline" size={24} color="#a855f7" />
                <Typo size={20} fontWeight="800" color={colors.white}>
                  {stats.timeSpent > 60
                    ? `${Math.round(stats.timeSpent / 60)}h`
                    : `${stats.timeSpent}m`}
                </Typo>
                <Typo size={12} fontWeight="600" color={colors.neutral300}>
                  Time Spent
                </Typo>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Course Progress List */}
          <Animated.View
            entering={FadeInUp.delay(800).springify()}
            style={styles.coursesSection}
          >
            <Typo
              size={20}
              fontWeight="800"
              color={colors.white}
              style={styles.sectionTitle}
            >
              Course Progress
            </Typo>

            {courses.length > 0 ? (
              <FlatList
                data={courses}
                renderItem={renderCourseProgressCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View style={{ height: spacingY._15 }} />
                )}
              />
            ) : (
              <Animated.View
                entering={FadeInUp.delay(1000).springify()}
                style={styles.emptyState}
              >
                <Ionicons
                  name="school-outline"
                  size={48}
                  color={colors.neutral500}
                />
                <Typo
                  size={18}
                  fontWeight="700"
                  color={colors.neutral400}
                  style={styles.emptyTitle}
                >
                  No Courses Yet
                </Typo>
                <Typo
                  size={14}
                  fontWeight="600"
                  color={colors.neutral500}
                  style={styles.emptySubtitle}
                >
                  Start learning by enrolling in your first course
                </Typo>
                <TouchableOpacity
                  style={styles.enrollButton}
                  onPress={() => router.push("/(tabs)")}
                >
                  <LinearGradient
                    colors={[colors.primary, "#8fbc8f"]}
                    style={styles.enrollButtonGradient}
                  >
                    <Typo size={16} fontWeight="700" color={colors.neutral900}>
                      Browse Courses
                    </Typo>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </ScreenWrapper>
    </View>
  );
};

export default ProgressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob: {
    position: "absolute",
    zIndex: 1,
  },
  blob1: {
    top: "15%",
    right: "10%",
  },
  blob2: {
    top: "60%",
    left: "5%",
  },
  screenWrapper: {
    backgroundColor: "transparent",
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
    alignItems: "center",
  },
  progressSection: {
    alignItems: "center",
    marginBottom: spacingY._40,
  },
  progressTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacingX._20,
    gap: spacingX._15,
    marginBottom: spacingY._40,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statCardGradient: {
    padding: spacingX._20,
    alignItems: "center",
    gap: spacingY._5,
  },
  coursesSection: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  sectionTitle: {
    marginBottom: spacingY._20,
  },
  courseCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  courseCardGradient: {
    padding: spacingX._20,
  },
  courseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacingY._15,
  },
  courseInfo: {
    flex: 1,
  },
  progressBadge: {
    backgroundColor: "rgba(163, 230, 53, 0.2)",
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._5,
    borderRadius: 12,
    marginLeft: spacingX._10,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  completedIconWrapper: {
    width: 24,
    height: 24,
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  streakIconWrapper: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacingY._40,
    gap: spacingY._15,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 20,
  },
  enrollButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: spacingY._10,
  },
  enrollButtonGradient: {
    paddingHorizontal: spacingX._25,
    paddingVertical: spacingY._12,
  },
});
