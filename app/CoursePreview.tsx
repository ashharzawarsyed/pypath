import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Course, SubCourse } from "@/types";
import {
  enrollUserInCourse,
  fetchCourseById,
  getCourseProgress,
  isUserEnrolled,
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

const CoursePreview = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [course, setCourse] = useState<Course | null>(null);
  const [subCourses, setSubCourses] = useState<SubCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const courseData = await fetchCourseById(courseId);
      if (courseData) {
        setCourse(courseData);

        // Check enrollment status
        if (user?.uid) {
          const isEnrolled = await isUserEnrolled(user.uid, courseId);
          setEnrolled(isEnrolled);

          if (isEnrolled) {
            const userProgress = await getCourseProgress(user.uid, courseId);
            setProgress(userProgress);
          }
        }

        // Load sub-courses
        const subCoursesData = await getSubCourses(courseId);
        setSubCourses(subCoursesData);
      }
    } catch (error) {
      console.error("Error loading course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user?.uid) return;

    try {
      setEnrolling(true);
      const success = await enrollUserInCourse(user.uid, courseId);
      if (success) {
        setEnrolled(true);
        // Navigate to course content
        router.push({ pathname: "/CourseContent", params: { courseId } });
      }
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinueLearning = () => {
    router.push({ pathname: "/CourseContent", params: { courseId } });
  };

  const renderSubCourse = useCallback(
    ({ item, index }: { item: SubCourse; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.subCourseCard}
      >
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.1)", "rgba(99, 102, 241, 0.05)"]}
          style={styles.subCourseGradient}
        >
          <View style={styles.subCourseHeader}>
            <View style={styles.subCourseNumber}>
              <Typo size={16} fontWeight="600" color={colors.primary}>
                {index + 1}
              </Typo>
            </View>
            <View style={styles.subCourseInfo}>
              <Typo size={18} fontWeight="600" color={colors.white}>
                {item.title}
              </Typo>
              <Typo size={14} color={colors.textLight}>
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
              ) : (
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={colors.neutral400}
                />
              )}
            </View>
          </View>

          <View style={styles.lecturesList}>
            {item.lectures.slice(0, 3).map((lecture, lectureIndex) => (
              <View key={lectureIndex} style={styles.lectureItem}>
                <Ionicons
                  name={
                    lecture.completed
                      ? "checkmark-circle"
                      : "play-circle-outline"
                  }
                  size={16}
                  color={lecture.completed ? colors.green : colors.textLight}
                />
                <Typo
                  size={14}
                  color={colors.textLight}
                  style={styles.lectureTitle}
                >
                  {lecture.title}
                </Typo>
                <Typo size={12} color={colors.neutral400}>
                  {lecture.duration}
                </Typo>
              </View>
            ))}
            {item.lectures.length > 3 && (
              <Typo
                size={12}
                color={colors.primary}
                style={styles.moreLectures}
              >
                +{item.lectures.length - 3} more lectures
              </Typo>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    ),
    []
  );

  if (loading || !course) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Typo>Loading...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

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

          {enrolled && (
            <View style={styles.progressContainer}>
              <Svg width={50} height={50}>
                <Circle
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="rgba(139, 92, 246, 0.3)"
                  strokeWidth="3"
                  fill="none"
                />
                <Circle
                  cx="25"
                  cy="25"
                  r="20"
                  stroke={colors.primary}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${progress * 1.256} 125.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 25 25)"
                />
              </Svg>
              <View style={styles.progressText}>
                <Typo size={10} fontWeight="600" color={colors.white}>
                  {Math.round(progress)}%
                </Typo>
              </View>
            </View>
          )}
        </Animated.View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Course Info */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.courseInfo}
          >
            <Typo
              size={28}
              fontWeight="800"
              color={colors.white}
              style={styles.courseTitle}
            >
              {course.title}
            </Typo>
            <Typo
              size={16}
              color={colors.textLight}
              style={styles.courseDescription}
            >
              {course.description}
            </Typo>

            <View style={styles.courseStats}>
              <View style={styles.statItem}>
                <Ionicons name="signal" size={16} color={colors.primary} />
                <Typo size={14} color={colors.textLight}>
                  {course.difficulty}
                </Typo>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={colors.primary} />
                <Typo size={14} color={colors.textLight}>
                  {course.duration}
                </Typo>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="library" size={16} color={colors.primary} />
                <Typo size={14} color={colors.textLight}>
                  {course.lessons} lessons
                </Typo>
              </View>
            </View>
          </Animated.View>

          {/* Sub Courses */}
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.subCoursesSection}
          >
            <Typo
              size={20}
              fontWeight="700"
              color={colors.white}
              style={styles.sectionTitle}
            >
              Course Content
            </Typo>

            <FlatList
              data={subCourses}
              renderItem={renderSubCourse}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={{ height: spacingY._15 }} />
              )}
            />
          </Animated.View>
        </ScrollView>

        {/* Action Button */}
        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={styles.actionContainer}
        >
          {enrolled ? (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueLearning}
            >
              <LinearGradient
                colors={[colors.primary, "#8fbc8f"]}
                style={styles.buttonGradient}
              >
                <Typo size={18} fontWeight="600" color={colors.neutral900}>
                  Continue Learning
                </Typo>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={handleEnroll}
              disabled={enrolling}
            >
              <LinearGradient
                colors={[colors.primary, "#8fbc8f"]}
                style={styles.buttonGradient}
              >
                <Typo size={18} fontWeight="600" color={colors.neutral900}>
                  {enrolling ? "Enrolling..." : "Start Learning"}
                </Typo>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScreenWrapper>
    </View>
  );
};

// Mock function for getting sub-courses
const getSubCourses = async (courseId: string): Promise<SubCourse[]> => {
  return [
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
        },
        {
          id: "python-uses",
          title: "Where is Python used?",
          duration: "12 min",
          completed: false,
        },
        {
          id: "how-python-works",
          title: "How Python works",
          duration: "15 min",
          completed: false,
        },
        {
          id: "python-revision",
          title: "Let's revise",
          duration: "10 min",
          completed: false,
        },
      ],
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
        },
        {
          id: "variables",
          title: "Variables",
          duration: "15 min",
          completed: false,
        },
        {
          id: "print-function",
          title: "Print Function",
          duration: "5 min",
          completed: false,
        },
      ],
    },
  ];
};

export default CoursePreview;

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
    paddingBottom: spacingY._20,
  },
  backButton: {
    padding: spacingX._10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
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
  content: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  courseInfo: {
    marginBottom: spacingY._30,
  },
  courseTitle: {
    marginBottom: spacingY._10,
  },
  courseDescription: {
    marginBottom: spacingY._20,
    lineHeight: 24,
  },
  courseStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
  },
  subCoursesSection: {
    marginBottom: spacingY._30,
  },
  sectionTitle: {
    marginBottom: spacingY._20,
  },
  subCourseCard: {
    borderRadius: 16,
    overflow: "hidden",
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
  subCourseStatus: {
    marginLeft: spacingX._10,
  },
  lecturesList: {
    gap: spacingY._10,
  },
  lectureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  lectureTitle: {
    flex: 1,
  },
  moreLectures: {
    textAlign: "center",
    marginTop: spacingY._5,
  },
  actionContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  continueButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  enrollButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: spacingY._15,
    alignItems: "center",
  },
});
