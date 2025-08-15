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
import React, { useEffect, useState } from "react";
import {
  Image,
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

type ProfileStats = {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLessons: number;
  completedLessons: number;
  overallProgress: number;
  streak: number;
  achievements: Achievement[];
  recentActivity: ActivityItem[];
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  color: string;
};

type ActivityItem = {
  id: string;
  type:
    | "completed_lesson"
    | "started_course"
    | "completed_course"
    | "achievement";
  title: string;
  subtitle: string;
  date: Date;
  icon: string;
  color: string;
};

const ProfileScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  useSafeAreaInsets();
  useWindowDimensions();

  const [stats, setStats] = useState<ProfileStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    overallProgress: 0,
    streak: 0,
    achievements: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "stats" | "achievements" | "activity"
  >("stats");

  // Animation values
  const headerAnimation = useSharedValue(0);
  const profileAnimation = useSharedValue(0);
  const statsAnimation = useSharedValue(0);
  const blobAnimation1 = useSharedValue(0);
  const blobAnimation2 = useSharedValue(0);
  const achievementPulse = useSharedValue(1);

  useEffect(() => {
    if (user?.uid) {
      loadProfileData();
    }
  }, [user?.uid]);

  useEffect(() => {
    // Start animations
    headerAnimation.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    profileAnimation.value = withDelay(
      200,
      withSpring(1, { damping: 15, stiffness: 150 })
    );

    statsAnimation.value = withDelay(
      400,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) })
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
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    blobAnimation2.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const loadProfileData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Get enrolled courses
      const enrolledCourses = await getUserEnrolledCourses(user.uid);

      let totalLessons = 0;
      let completedLessons = 0;
      let totalProgress = 0;
      let completedCount = 0;
      let inProgressCount = 0;

      for (const course of enrolledCourses) {
        const progress = await getCourseProgress(user.uid, course.id);
        totalProgress += progress;

        const courseLessons = course.lessons || 0;
        totalLessons += courseLessons;
        completedLessons += Math.round((progress / 100) * courseLessons);

        if (progress >= 100) {
          completedCount++;
        } else if (progress > 0) {
          inProgressCount++;
        }
      }

      const overallProgress =
        enrolledCourses.length > 0
          ? Math.round(totalProgress / enrolledCourses.length)
          : 0;

      // Calculate real streak days
      const realStreakDays = await calculateUserStreak(user.uid);

      // Generate achievements based on user progress
      const achievements = generateAchievements(
        completedCount,
        overallProgress,
        totalLessons
      );

      // Generate recent activity
      const recentActivity = generateRecentActivity(enrolledCourses);

      setStats({
        totalCourses: enrolledCourses.length,
        completedCourses: completedCount,
        inProgressCourses: inProgressCount,
        totalLessons,
        completedLessons,
        overallProgress,
        streak: realStreakDays,
        achievements,
        recentActivity,
      });
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real user streak based on activity
  const calculateUserStreak = async (userId: string): Promise<number> => {
    try {
      const { firestore } = await import("@/config/firebase");
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );

      const progressRef = collection(firestore, "userProgress");
      const q = query(progressRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return 0;

      // Calculate consecutive days of activity
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

      // Check if user was active today or yesterday
      const mostRecentActivity = uniqueDays[0];
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - mostRecentActivity) / (1000 * 60 * 60 * 24)
      );

      // If last activity was more than 1 day ago, streak is broken
      if (daysSinceLastActivity > 1) return 0;

      // Count consecutive days
      let streak = 0;
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

  const generateAchievements = (
    completedCourses: number,
    overallProgress: number,
    totalLessons: number
  ): Achievement[] => {
    const achievements: Achievement[] = [
      {
        id: "first-course",
        title: "Getting Started",
        description: "Complete your first course",
        icon: "school",
        unlocked: completedCourses >= 1,
        color: colors.primary,
        unlockedAt: completedCourses >= 1 ? new Date() : undefined,
      },
      {
        id: "progress-master",
        title: "Progress Master",
        description: "Reach 50% overall progress",
        icon: "trending-up",
        unlocked: overallProgress >= 50,
        color: "#f97316",
        unlockedAt: overallProgress >= 50 ? new Date() : undefined,
      },
      {
        id: "dedicated-learner",
        title: "Dedicated Learner",
        description: "Complete 3 courses",
        icon: "trophy",
        unlocked: completedCourses >= 3,
        color: colors.green,
        unlockedAt: completedCourses >= 3 ? new Date() : undefined,
      },
      {
        id: "lesson-hunter",
        title: "Lesson Hunter",
        description: "Complete 50 lessons",
        icon: "target",
        unlocked: totalLessons >= 50,
        color: "#8b5cf6",
        unlockedAt: totalLessons >= 50 ? new Date() : undefined,
      },
      {
        id: "perfectionist",
        title: "Perfectionist",
        description: "Reach 100% progress",
        icon: "star",
        unlocked: overallProgress >= 100,
        color: "#fbbf24",
        unlockedAt: overallProgress >= 100 ? new Date() : undefined,
      },
    ];

    return achievements;
  };

  const generateRecentActivity = (courses: Course[]): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    if (courses.length > 0) {
      activities.push({
        id: "1",
        type: "started_course",
        title: `Started ${courses[0].title}`,
        subtitle: "Python programming journey begins",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        icon: "play-circle",
        color: colors.primary,
      });

      if (courses.length > 1) {
        activities.push({
          id: "2",
          type: "completed_lesson",
          title: "Completed Variables lesson",
          subtitle: "Python Fundamentals",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          icon: "checkmark-circle",
          color: colors.green,
        });
      }

      activities.push({
        id: "3",
        type: "achievement",
        title: "Unlocked Getting Started",
        subtitle: "First achievement earned!",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        icon: "medal",
        color: "#fbbf24",
      });
    }

    return activities;
  };

  // Animation styles
  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(headerAnimation.value, [0, 1], [-50, 0]);
    const opacity = interpolate(headerAnimation.value, [0, 1], [0, 1]);
    return { transform: [{ translateY }], opacity };
  });

  const profileStyle = useAnimatedStyle(() => {
    const scale = interpolate(profileAnimation.value, [0, 1], [0.8, 1]);
    return { transform: [{ scale }] };
  });

  const statsStyle = useAnimatedStyle(() => {
    const translateY = interpolate(statsAnimation.value, [0, 1], [30, 0]);
    const opacity = interpolate(statsAnimation.value, [0, 1], [0, 1]);
    return { transform: [{ translateY }], opacity };
  });

  const blob1Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [-20, 40, -20]
    );
    const translateY = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [-15, 25, -15]
    );
    const scale = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [0.9, 1.1, 0.9]
    );
    return { transform: [{ translateX }, { translateY }, { scale }] };
  });

  const blob2Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [30, -25, 30]
    );
    const translateY = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [20, -30, 20]
    );
    const scale = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [1.1, 0.8, 1.1]
    );
    return { transform: [{ translateX }, { translateY }, { scale }] };
  });

  const achievementStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: achievementPulse.value }] };
  });

  const renderTabContent = () => {
    switch (selectedTab) {
      case "stats":
        return renderStatsContent();
      case "achievements":
        return renderAchievementsContent();
      case "activity":
        return renderActivityContent();
      default:
        return renderStatsContent();
    }
  };

  const renderStatsContent = () => (
    <Animated.View style={[styles.tabContent, statsStyle]}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={["rgba(34, 197, 94, 0.25)", "rgba(34, 197, 94, 0.08)"]}
            style={styles.statCardGradient}
          >
            <Ionicons name="library" size={24} color={colors.green} />
            <Typo size={24} fontWeight="800" color={colors.white}>
              {stats.completedCourses}/{stats.totalCourses}
            </Typo>
            <Typo size={12} fontWeight="600" color={colors.neutral300}>
              Courses Completed
            </Typo>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.25)", "rgba(139, 92, 246, 0.08)"]}
            style={styles.statCardGradient}
          >
            <Ionicons name="play-circle" size={24} color={colors.primary} />
            <Typo size={24} fontWeight="800" color={colors.white}>
              {stats.completedLessons}
            </Typo>
            <Typo size={12} fontWeight="600" color={colors.neutral300}>
              Lessons Completed
            </Typo>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["rgba(249, 115, 22, 0.25)", "rgba(249, 115, 22, 0.08)"]}
            style={styles.statCardGradient}
          >
            <Ionicons name="flame" size={24} color="#f97316" />
            <Typo size={24} fontWeight="800" color={colors.white}>
              {stats.streak}
            </Typo>
            <Typo size={12} fontWeight="600" color={colors.neutral300}>
              Day Streak
            </Typo>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["rgba(168, 85, 247, 0.25)", "rgba(168, 85, 247, 0.08)"]}
            style={styles.statCardGradient}
          >
            <Ionicons name="trending-up" size={24} color="#a855f7" />
            <Typo size={24} fontWeight="800" color={colors.white}>
              {stats.overallProgress}%
            </Typo>
            <Typo size={12} fontWeight="600" color={colors.neutral300}>
              Overall Progress
            </Typo>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );

  const renderAchievementsContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.achievementsGrid}>
        {stats.achievements.map((achievement, index) => (
          <Animated.View
            key={achievement.id}
            entering={FadeInDown.delay(index * 100).springify()}
            style={[
              styles.achievementCard,
              !achievement.unlocked && styles.lockedAchievement,
            ]}
          >
            <LinearGradient
              colors={
                achievement.unlocked
                  ? [`${achievement.color}35`, `${achievement.color}15`]
                  : ["rgba(115, 115, 115, 0.2)", "rgba(115, 115, 115, 0.08)"]
              }
              style={styles.achievementCardGradient}
            >
              <Animated.View
                style={achievement.unlocked ? achievementStyle : undefined}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.unlocked
                        ? `${achievement.color}50`
                        : "rgba(115, 115, 115, 0.4)",
                    },
                  ]}
                >
                  <Ionicons
                    name={achievement.icon as any}
                    size={24}
                    color={
                      achievement.unlocked
                        ? achievement.color
                        : colors.neutral400
                    }
                  />
                </View>
              </Animated.View>
              <Typo
                size={16}
                fontWeight="700"
                color={achievement.unlocked ? colors.white : colors.neutral400}
                style={styles.achievementTitle}
              >
                {achievement.title}
              </Typo>
              <Typo
                size={12}
                fontWeight="500"
                color={
                  achievement.unlocked ? colors.neutral300 : colors.neutral500
                }
                style={styles.achievementDescription}
              >
                {achievement.description}
              </Typo>
              {achievement.unlocked && achievement.unlockedAt && (
                <Typo
                  size={10}
                  fontWeight="500"
                  color={colors.neutral400}
                  style={styles.achievementDate}
                >
                  Unlocked {achievement.unlockedAt.toLocaleDateString()}
                </Typo>
              )}
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderActivityContent = () => (
    <View style={styles.tabContent}>
      {stats.recentActivity.length > 0 ? (
        <View style={styles.activityList}>
          {stats.recentActivity.map((activity, index) => (
            <Animated.View
              key={activity.id}
              entering={FadeInLeft.delay(index * 150).springify()}
              style={styles.activityItem}
            >
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: `${activity.color}30` },
                ]}
              >
                <Ionicons
                  name={activity.icon as any}
                  size={20}
                  color={activity.color}
                />
              </View>
              <View style={styles.activityContent}>
                <Typo size={14} fontWeight="700" color={colors.white}>
                  {activity.title}
                </Typo>
                <Typo size={12} fontWeight="500" color={colors.neutral300}>
                  {activity.subtitle}
                </Typo>
                <Typo size={10} fontWeight="500" color={colors.neutral400}>
                  {activity.date.toLocaleDateString()}
                </Typo>
              </View>
            </Animated.View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyActivity}>
          <Ionicons name="time-outline" size={48} color={colors.neutral500} />
          <Typo size={16} fontWeight="600" color={colors.neutral400}>
            No recent activity
          </Typo>
          <Typo size={12} fontWeight="500" color={colors.neutral500}>
            Start learning to see your activity here
          </Typo>
        </View>
      )}
    </View>
  );

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
              Loading profile...
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

      {/* Animated background blobs */}
      <Animated.View style={[styles.blob, styles.blob1, blob1Style]}>
        <Svg width="200" height="200" viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="blobGrad1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.12" />
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
              <Stop offset="0%" stopColor="#8fbc8f" stopOpacity="0.15" />
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
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.white}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Profile Section */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={[styles.profileSection, profileStyle]}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.primary, "#8fbc8f"]}
                style={styles.avatarGradient}
              >
                {user?.image ? (
                  <Image source={{ uri: user.image }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person" size={40} color={colors.neutral900} />
                )}
              </LinearGradient>
            </View>
            <Typo
              size={28}
              fontWeight="900"
              color={colors.white}
              style={styles.userName}
            >
              {user?.name || "Learning Enthusiast"}
            </Typo>
            <Typo
              size={14}
              fontWeight="600"
              color={colors.neutral300}
              style={styles.userEmail}
            >
              {user?.email}
            </Typo>

            {/* Progress Ring */}
            <View style={styles.progressRing}>
              <Svg width={80} height={80}>
                <Defs>
                  <SvgLinearGradient
                    id="progressGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={colors.primary}
                      stopOpacity="1"
                    />
                    <Stop offset="100%" stopColor="#8fbc8f" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="rgba(163, 230, 53, 0.3)"
                  strokeWidth="6"
                  fill="none"
                />
                <Circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="url(#progressGrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${stats.overallProgress * 1.88} 188`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </Svg>
              <View style={styles.progressText}>
                <Typo size={14} fontWeight="800" color={colors.white}>
                  {stats.overallProgress}%
                </Typo>
              </View>
            </View>
          </Animated.View>

          {/* Tab Navigation */}
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.tabNavigation}
          >
            {[
              { key: "stats", label: "Stats", icon: "bar-chart" },
              { key: "achievements", label: "Achievements", icon: "trophy" },
              { key: "activity", label: "Activity", icon: "time" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  selectedTab === tab.key && styles.activeTab,
                ]}
                onPress={() => setSelectedTab(tab.key as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={
                    selectedTab === tab.key
                      ? colors.neutral900
                      : colors.neutral300
                  }
                />
                <Typo
                  size={12}
                  fontWeight={selectedTab === tab.key ? "700" : "600"}
                  color={
                    selectedTab === tab.key
                      ? colors.neutral900
                      : colors.neutral300
                  }
                >
                  {tab.label}
                </Typo>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Tab Content */}
          <Animated.View entering={FadeInUp.delay(600).springify()}>
            {renderTabContent()}
          </Animated.View>
        </ScrollView>
      </ScreenWrapper>
    </View>
  );
};

export default ProfileScreen;

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
    top: "10%",
    right: "5%",
  },
  blob2: {
    top: "70%",
    left: "10%",
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
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._10,
  },
  settingsButton: {
    padding: spacingX._10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  avatarContainer: {
    marginBottom: spacingY._15,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  userName: {
    marginBottom: spacingY._5,
    textAlign: "center",
  },
  userEmail: {
    marginBottom: spacingY._20,
    textAlign: "center",
  },
  progressRing: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  tabNavigation: {
    flexDirection: "row",
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._25,
    gap: spacingX._10,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._15,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    gap: spacingX._7,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabContent: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._30,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingX._15,
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
    gap: spacingY._7,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingX._15,
  },
  achievementCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  lockedAchievement: {
    opacity: 0.6,
  },
  achievementCardGradient: {
    padding: spacingX._15,
    alignItems: "center",
    gap: spacingY._7,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementTitle: {
    textAlign: "center",
  },
  achievementDescription: {
    textAlign: "center",
    lineHeight: 16,
  },
  achievementDate: {
    textAlign: "center",
    marginTop: spacingY._5,
  },
  activityList: {
    gap: spacingY._15,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacingX._15,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._15,
  },
  activityContent: {
    flex: 1,
    gap: spacingY._5,
  },
  emptyActivity: {
    alignItems: "center",
    paddingVertical: spacingY._40,
    gap: spacingY._10,
  },
  settingsSection: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._40,
  },
  sectionTitle: {
    marginBottom: spacingY._20,
  },
  settingsList: {
    gap: spacingY._10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacingX._15,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._15,
  },
  settingTitle: {
    flex: 1,
  },
});
