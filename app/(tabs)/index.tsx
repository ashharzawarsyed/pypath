import CourseCard from "@/components/CourseCard";
import DrawerMenu from "@/components/DrawerMenu";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
// import { useAuth } from "@/contexts/authContext";
import { Course } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";

// TODO: Replace with fetchCourses from @/utils/courseService
const MOCK_COURSES: Course[] = [
  {
    id: "python-basics",
    title: "Python Fundamentals",
    description:
      "Master the building blocks of Python programming with hands-on exercises and real-world projects.",
    difficulty: "Beginner",
    duration: "4 weeks",
    lessons: 24,
    topics: ["Variables", "Functions", "Data Structures", "Control Flow"],
    isPopular: true,
    createdAt: new Date(),
  },
  {
    id: "python-intermediate",
    title: "Object-Oriented Python",
    description:
      "Deep dive into OOP concepts, design patterns, and advanced Python features for scalable applications.",
    difficulty: "Intermediate",
    duration: "6 weeks",
    lessons: 32,
    topics: ["Classes", "Inheritance", "Polymorphism", "Decorators"],
    isPopular: false,
    createdAt: new Date(),
  },
  {
    id: "python-advanced",
    title: "Advanced Python Mastery",
    description:
      "Explore metaclasses, async programming, and performance optimization techniques.",
    difficulty: "Advanced",
    duration: "8 weeks",
    lessons: 28,
    topics: ["Metaclasses", "Async/Await", "Memory Management", "Profiling"],
    isPopular: false,
    createdAt: new Date(),
  },
  {
    id: "python-ml-ai",
    title: "Python for AI & Machine Learning",
    description:
      "Build intelligent applications using NumPy, Pandas, Scikit-learn, and TensorFlow.",
    difficulty: "Advanced",
    duration: "12 weeks",
    lessons: 45,
    topics: ["NumPy", "Pandas", "ML Algorithms", "Deep Learning"],
    isPopular: true,
    createdAt: new Date(),
  },
];

const CoursesHomeScreen = () => {
  // const { user } = useAuth(); // TODO: Use user.uid for enrollment checks
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [courses] = useState<Course[]>(MOCK_COURSES);
  const [loading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Animated values for organic blob shapes
  const blobAnimation1 = useSharedValue(0);
  const blobAnimation2 = useSharedValue(0);
  const blobAnimation3 = useSharedValue(0);

  useEffect(() => {
    // Start multiple blob animations with different timings
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

    blobAnimation3.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Animated styles for organic blob shapes
  const animatedBlob1Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [-50, 100, -50]
    );
    const translateY = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [-30, 50, -30]
    );
    const scale = interpolate(
      blobAnimation1.value,
      [0, 0.5, 1],
      [0.8, 1.2, 0.8]
    );

    return {
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  const animatedBlob2Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [80, -60, 80]
    );
    const translateY = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [40, -80, 40]
    );
    const scale = interpolate(
      blobAnimation2.value,
      [0, 0.5, 1],
      [1.1, 0.9, 1.1]
    );

    return {
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  const animatedBlob3Style = useAnimatedStyle(() => {
    const translateX = interpolate(
      blobAnimation3.value,
      [0, 0.5, 1],
      [-40, 30, -40]
    );
    const translateY = interpolate(
      blobAnimation3.value,
      [0, 0.5, 1],
      [60, -40, 60]
    );
    const scale = interpolate(
      blobAnimation3.value,
      [0, 0.5, 1],
      [0.9, 1.3, 0.9]
    );

    return {
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  // TODO: Replace with real enrollment check using useAuth() uid
  const mockEnrollments = useMemo(
    () => new Set(["python-basics", "python-intermediate"]),
    []
  );

  const isEnrolled = useCallback(
    (courseId: string) => {
      // TODO: return isUserEnrolled(user?.uid, courseId)
      return mockEnrollments.has(courseId);
    },
    [mockEnrollments]
  );

  const handleCoursePress = useCallback(
    (courseId: string) => {
      // TODO: Check enrollment status and navigate accordingly
      router.push({ pathname: "/CoursePreview", params: { courseId } });
    },
    [router]
  );

  const getCardOffset = useCallback(
    (index: number): React.ComponentProps<typeof View>["style"] => {
      // Alternating left/right positioning
      const isLeft = index % 2 === 0;
      const baseOffset = width * 0.05;
      return {
        alignSelf: isLeft ? ("flex-start" as const) : ("flex-end" as const),
        marginLeft: isLeft ? baseOffset : 0,
        marginRight: isLeft ? 0 : baseOffset,
      };
    },
    [width]
  );

  const keyExtractor = useCallback((item: Course) => item.id, []);

  // Render function for FlatList items
  const renderCourseCard = useCallback(
    ({ item, index }: ListRenderItemInfo<Course>) => (
      <Animated.View
        entering={FadeInDown.delay(index * 200).springify()}
        style={[styles.cardWrapper, getCardOffset(index)]}
      >
        <CourseCard
          course={item}
          enrolled={isEnrolled(item.id)}
          onPress={() => handleCoursePress(item.id)}
        />
      </Animated.View>
    ),
    [getCardOffset, isEnrolled, handleCoursePress]
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.gradientContainer}>
      {/* Base dark background */}
      <LinearGradient
        colors={["#0f0f23", "#1a1a2e", "#16213e"]}
        style={styles.baseGradient}
      />

      {/* Animated organic blob shapes */}
      <Animated.View style={[styles.blob, styles.blob1, animatedBlob1Style]}>
        <Svg width="300" height="300" viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="grad1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#7c3aed" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
            </RadialGradient>
          </Defs>
          <Path
            d="M150,50 C200,60 250,100 240,150 C230,200 180,240 130,230 C80,220 40,180 50,130 C60,80 100,40 150,50 Z"
            fill="url(#grad1)"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.blob, styles.blob2, animatedBlob2Style]}>
        <Svg width="250" height="250" viewBox="0 0 250 250">
          <Defs>
            <RadialGradient id="grad2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
              <Stop offset="50%" stopColor="#9333ea" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#7c2d12" stopOpacity="0.1" />
            </RadialGradient>
          </Defs>
          <Path
            d="M125,30 C170,35 210,70 205,115 C200,160 165,200 120,195 C75,190 35,155 40,110 C45,65 80,25 125,30 Z"
            fill="url(#grad2)"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.blob, styles.blob3, animatedBlob3Style]}>
        <Svg width="200" height="200" viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="grad3" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
              <Stop offset="50%" stopColor="#a78bfa" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
            </RadialGradient>
          </Defs>
          <Path
            d="M100,20 C140,25 170,55 165,95 C160,135 130,165 90,160 C50,155 20,125 25,85 C30,45 60,15 100,20 Z"
            fill="url(#grad3)"
          />
        </Svg>
      </Animated.View>

      {/* Subtle overlay for content readability */}
      <LinearGradient
        colors={[
          "rgba(15, 15, 35, 0.3)",
          "rgba(26, 26, 46, 0.2)",
          "rgba(22, 33, 62, 0.3)",
        ]}
        style={styles.overlayGradient}
      />

      <ScreenWrapper style={styles.screenWrapper}>
        <View style={styles.container}>
          {/* Header */}
          <Animated.View entering={FadeInUp.springify()} style={styles.header}>
            <TouchableOpacity
              accessible
              accessibilityLabel="Open navigation menu"
              style={styles.menuButton}
              onPress={() => setDrawerVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color={colors.white} />
            </TouchableOpacity>

            <Typo size={32} fontWeight="800" style={styles.heading}>
              Courses
            </Typo>
          </Animated.View>

          {/* Course List */}
          <View style={styles.listContainer}>
            <FlatList
              ref={flatListRef}
              data={courses}
              renderItem={renderCourseCard}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.flatListContent,
                { paddingBottom: insets.bottom + spacingY._60 },
              ]}
              removeClippedSubviews={false}
              initialNumToRender={4}
              maxToRenderPerBatch={2}
              windowSize={8}
              scrollEventThrottle={16}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>

        <DrawerMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </ScreenWrapper>
    </View>
  );
};

export default CoursesHomeScreen;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    position: "relative",
  },
  baseGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  blob: {
    position: "absolute",
    zIndex: 1,
  },
  blob1: {
    top: "10%",
    left: "20%",
  },
  blob2: {
    top: "40%",
    right: "15%",
  },
  blob3: {
    top: "70%",
    left: "10%",
  },
  overlayGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  screenWrapper: {
    backgroundColor: "transparent",
    zIndex: 3,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._35,
    paddingTop: spacingY._15,
  },
  menuButton: {
    marginRight: spacingX._15,
    padding: spacingX._10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  heading: {
    color: colors.white,
  },
  listContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingTop: spacingY._20,
  },
  cardWrapper: {
    width: "80%",
  },
  separator: {
    height: spacingY._30,
  },
});
