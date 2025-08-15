import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Course, Lecture, SubCourse } from "@/types";
import {
  fetchCourseById,
  getCourseProgress,
  getSubCourses,
  updateLectureProgress,
} from "@/utils/courseService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

type TabType = "Index" | "Compile" | "Programs" | "Cheats" | "Description";

const CourseContent = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [course, setCourse] = useState<Course | null>(null);
  const [subCourses, setSubCourses] = useState<SubCourse[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("Index");
  const [progress, setProgress] = useState(0);
  const [expandedLecture, setExpandedLecture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs: TabType[] = [
    "Index",
    "Compile",
    "Programs",
    "Cheats",
    "Description",
  ];

  // Remove the complex focus listener and use a simpler approach
  useEffect(() => {
    if (courseId && user?.uid) {
      loadCourseContent();
    }
  }, [courseId, user?.uid]);

  // Remove the periodic refresh - it's causing unnecessary API calls
  // useEffect(() => {
  //   // Simple periodic refresh when the component is active
  //   const interval = setInterval(() => {
  //     if (courseId && user?.uid && !loading) {
  //       console.log("Periodic refresh of course content");
  //       loadCourseContent();
  //     }
  //   }, 5000); // Refresh every 5 seconds
  //
  //   return () => clearInterval(interval);
  // }, [courseId, user?.uid, loading]);

  // Add a simple focus listener for when returning from lecture screen
  useEffect(() => {
    let refreshTimer: number;

    const handleVisibilityChange = () => {
      // Only refresh when returning from a lecture (after a short delay)
      if (courseId && user?.uid && !loading) {
        clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          console.log("Refreshing course content after returning from lecture");
          loadCourseContent();
        }, 1000); // Wait 1 second before refreshing
      }
    };

    // Set up a simple refresh mechanism that only triggers occasionally
    // This will refresh when the component mounts and when explicitly needed
    return () => {
      clearTimeout(refreshTimer);
    };
  }, []);

  // Add a manual refresh function that can be called when needed
  const refreshCourseContent = useCallback(async () => {
    if (courseId && user?.uid && !loading) {
      console.log("Manual refresh of course content");
      await loadCourseContent();
    }
  }, [courseId, user?.uid, loading]);

  const loadCourseContent = async () => {
    try {
      setLoading(true);
      console.log("Starting to load course content...");

      const courseData = await fetchCourseById(courseId);
      if (courseData) {
        setCourse(courseData);
        console.log("Course data loaded:", courseData.title);
      }

      if (user?.uid) {
        const userProgress = await getCourseProgress(user.uid, courseId);
        setProgress(userProgress);
        console.log("User progress loaded:", userProgress);
      }

      // Load sub-courses from Firestore with progress tracking
      console.log(
        "Loading sub-courses for courseId:",
        courseId,
        "userId:",
        user?.uid
      );
      const subCoursesData = await getSubCourses(courseId, user?.uid);
      console.log("Loaded sub-courses:", subCoursesData.length, "items");

      // Always set the data, even if it's mock data
      setSubCourses(subCoursesData);
    } catch (error) {
      console.error("Error loading course content:", error);

      // Emergency fallback - create mock data directly
      console.log("Using emergency fallback mock data");
      const emergencyMockData = [
        {
          id: "intro-python",
          title: "Introduction to Python",
          duration: "45 min",
          completed: false,
          lectures: [
            {
              id: "what-is-python",
              title: "What is Python?",
              duration: "8 min",
              completed: false,
              order: 1,
              hasQuiz: true,
              isLocked: false,
            },
            {
              id: "python-uses",
              title: "Where is Python used?",
              duration: "12 min",
              completed: false,
              order: 2,
              hasQuiz: true,
              isLocked: true,
            },
          ],
          order: 1,
          isLocked: false,
        },
        {
          id: "first-program",
          title: "Your First Python Program",
          duration: "30 min",
          completed: false,
          lectures: [
            {
              id: "hello-world",
              title: "Hello World",
              duration: "10 min",
              completed: false,
              order: 1,
              hasQuiz: false,
              isLocked: true,
            },
          ],
          order: 2,
          isLocked: true,
        },
      ];
      setSubCourses(emergencyMockData);
    } finally {
      console.log("Finished loading course content");
      setLoading(false);
    }
  };

  const handleLecturePress = (
    subCourseId: string,
    lectureId: string,
    lecture: Lecture
  ) => {
    if (lecture.isLocked) {
      // Show locked message
      return;
    }

    // Navigate to detailed lecture screen
    router.push({
      pathname: "/LectureScreen",
      params: { courseId, subCourseId, lectureId },
    });
  };

  const handleContinue = async (subCourseId: string, lectureId: string) => {
    if (!user?.uid) return;

    try {
      // Mark lecture as completed
      await updateLectureProgress(
        user.uid,
        courseId,
        subCourseId,
        lectureId,
        true
      );

      // Reload progress
      const newProgress = await getCourseProgress(user.uid, courseId);
      setProgress(newProgress);

      // Update local state
      setSubCourses((prev) =>
        prev.map((subCourse) => ({
          ...subCourse,
          lectures: subCourse.lectures.map((lecture) =>
            lecture.id === lectureId ? { ...lecture, completed: true } : lecture
          ),
        }))
      );

      setExpandedLecture(null);
    } catch (error) {
      console.error("Error updating lecture progress:", error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Index":
        return renderIndexContent();
      case "Compile":
        return renderCompileContent();
      case "Programs":
        return renderProgramsContent();
      case "Cheats":
        return renderCheatsContent();
      case "Description":
        return renderDescriptionContent();
      default:
        return renderIndexContent();
    }
  };

  const renderIndexContent = () => (
    <FlatList
      data={subCourses}
      renderItem={renderSubCourse}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: spacingY._20 }} />}
    />
  );

  const renderSubCourse = useCallback(
    ({ item, index }: { item: SubCourse; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[styles.subCourseCard, item.isLocked && styles.lockedSubCourse]}
      >
        <LinearGradient
          colors={
            item.isLocked
              ? ["rgba(115, 115, 115, 0.1)", "rgba(82, 82, 82, 0.05)"]
              : ["rgba(139, 92, 246, 0.1)", "rgba(99, 102, 241, 0.05)"]
          }
          style={styles.subCourseGradient}
        >
          <View style={styles.subCourseHeader}>
            <View
              style={[
                styles.subCourseNumber,
                item.isLocked && styles.lockedNumber,
              ]}
            >
              {item.isLocked ? (
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={colors.neutral400}
                />
              ) : (
                <Typo size={16} fontWeight="600" color={colors.primary}>
                  {index + 1}
                </Typo>
              )}
            </View>
            <View style={styles.subCourseInfo}>
              <Typo
                size={18}
                fontWeight="600"
                color={item.isLocked ? colors.neutral400 : colors.white}
              >
                {item.title}
              </Typo>
              <Typo
                size={14}
                color={item.isLocked ? colors.neutral500 : colors.textLight}
              >
                {item.lectures.length} lectures • {item.duration}
              </Typo>
            </View>
            <View style={styles.subCourseStatus}>
              {item.completed ? (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.green}
                />
              ) : item.isLocked ? (
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={colors.neutral400}
                />
              ) : null}
            </View>
          </View>

          <View style={styles.lecturesList}>
            {item.lectures.map((lecture, lectureIndex) => (
              <TouchableOpacity
                key={lecture.id}
                style={[
                  styles.lectureCard,
                  lecture.isLocked && styles.lockedLecture,
                ]}
                onPress={() => handleLecturePress(item.id, lecture.id, lecture)}
                disabled={lecture.isLocked || item.isLocked}
              >
                <View style={styles.lectureHeader}>
                  <Ionicons
                    name={
                      lecture.completed
                        ? "checkmark-circle"
                        : lecture.isLocked || item.isLocked
                        ? "lock-closed"
                        : "play-circle-outline"
                    }
                    size={20}
                    color={
                      lecture.completed
                        ? colors.green
                        : lecture.isLocked || item.isLocked
                        ? colors.neutral400
                        : colors.primary
                    }
                  />
                  <Typo
                    size={15}
                    color={
                      lecture.isLocked || item.isLocked
                        ? colors.neutral400
                        : colors.white
                    }
                    style={styles.lectureTitle}
                  >
                    {lecture.title}
                  </Typo>
                  <View style={styles.lectureMeta}>
                    {lecture.hasQuiz && (
                      <Ionicons
                        name="help-circle-outline"
                        size={14}
                        color={
                          lecture.isLocked || item.isLocked
                            ? colors.neutral500
                            : colors.primary
                        }
                      />
                    )}
                    <Typo
                      size={12}
                      color={
                        lecture.isLocked || item.isLocked
                          ? colors.neutral500
                          : colors.neutral400
                      }
                    >
                      {lecture.duration}
                    </Typo>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {item.isLocked && (
            <View style={styles.lockedMessage}>
              <Typo
                size={12}
                color={colors.neutral400}
                style={{ textAlign: "center" }}
              >
                Complete the previous section to unlock
              </Typo>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    ),
    []
  );

  const renderCompileContent = () => (
    <View style={styles.tabContent}>
      <Typo
        size={18}
        fontWeight="600"
        color={colors.white}
        style={styles.tabTitle}
      >
        Python Compiler
      </Typo>
      <View style={styles.compilerContainer}>
        <Typo size={14} color={colors.textLight}>
          Interactive Python compiler coming soon...
        </Typo>
      </View>
    </View>
  );

  const renderProgramsContent = () => (
    <View style={styles.tabContent}>
      <Typo
        size={18}
        fontWeight="600"
        color={colors.white}
        style={styles.tabTitle}
      >
        Sample Programs
      </Typo>
      <Typo size={14} color={colors.textLight}>
        Practice programs and examples will be available here.
      </Typo>
    </View>
  );

  const renderCheatsContent = () => (
    <View style={styles.tabContent}>
      <Typo
        size={18}
        fontWeight="600"
        color={colors.white}
        style={styles.tabTitle}
      >
        Python Cheat Sheet
      </Typo>
      <Typo size={14} color={colors.textLight}>
        Quick reference guide for Python syntax and functions.
      </Typo>
    </View>
  );

  const renderDescriptionContent = () => (
    <View style={styles.tabContent}>
      <Typo
        size={18}
        fontWeight="600"
        color={colors.white}
        style={styles.tabTitle}
      >
        Course Description
      </Typo>
      <Typo size={14} color={colors.textLight} style={styles.description}>
        {course?.description}
      </Typo>
    </View>
  );

  if (loading || !course) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Typo>Loading course content...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  // Add debug info to see what's happening
  console.log("Rendering CourseContent with:", {
    courseLoaded: !!course,
    subCoursesCount: subCourses.length,
    loading,
    activeTab,
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f0f23", "#1a1a2e", "#16213e"]}
        style={styles.gradient}
      />

      <ScreenWrapper style={styles.screenWrapper}>
        {/* Header */}
        <Animated.View entering={FadeInUp.springify()} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <Typo
            size={18}
            fontWeight="600"
            color={colors.white}
            style={styles.courseTitle}
          >
            {course.title}
          </Typo>

          <View style={styles.progressContainer}>
            <Svg width={40} height={40}>
              <Circle
                cx="20"
                cy="20"
                r="16"
                stroke="rgba(139, 92, 246, 0.3)"
                strokeWidth="2"
                fill="none"
              />
              <Circle
                cx="20"
                cy="20"
                r="16"
                stroke={colors.primary}
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${progress * 1.005} 100.5`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </Svg>
            <View style={styles.progressText}>
              <Typo size={8} fontWeight="600" color={colors.white}>
                {Math.round(progress)}%
              </Typo>
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.tabsContainer}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScrollView}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Typo
                  size={14}
                  fontWeight={activeTab === tab ? "600" : "400"}
                  color={
                    activeTab === tab ? colors.neutral900 : colors.textLight
                  }
                >
                  {tab}
                </Typo>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Tab Content */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.contentContainer}
        >
          {renderTabContent()}
        </Animated.View>
      </ScreenWrapper>
    </View>
  );
};

// Remove mock function, now using real Firestore data

export default CourseContent;

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
  screenWrapper: {
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._15,
  },
  backButton: {
    padding: spacingX._7,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  courseTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacingX._15,
  },
  progressContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._20,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    marginRight: spacingX._10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  subCourseCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: spacingY._15,
  },
  subCourseGradient: {
    padding: spacingX._20,
  },
  subCourseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._15,
  },
  subCourseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._15,
  },
  subCourseInfo: {
    flex: 1,
  },
  lecturesList: {
    gap: spacingY._10,
  },
  lectureCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: spacingX._15,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  lectureCardExpanded: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: colors.primary,
  },
  lectureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  lectureTitle: {
    flex: 1,
  },
  lectureContent: {
    marginTop: spacingY._15,
    paddingTop: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.2)",
  },
  lectureDescription: {
    lineHeight: 20,
    marginBottom: spacingY._15,
  },
  continueButton: {
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  continueGradient: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
  },
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    marginBottom: spacingY._20,
  },
  compilerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: spacingX._20,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    lineHeight: 22,
  },
  lockedSubCourse: {
    opacity: 0.6,
  },
  lockedNumber: {
    backgroundColor: "rgba(115, 115, 115, 0.2)",
  },
  lockedLecture: {
    backgroundColor: "rgba(115, 115, 115, 0.05)",
    borderColor: "rgba(115, 115, 115, 0.2)",
  },
  lectureMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
  },
  lockedMessage: {
    marginTop: spacingY._15,
    paddingTop: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: "rgba(115, 115, 115, 0.2)",
  },
});
