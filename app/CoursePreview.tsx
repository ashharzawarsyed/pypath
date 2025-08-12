import Button from "@/components/Button";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { firestore } from "@/config/firebase";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Course } from "@/types";
import { enrollUser } from "@/utils/courseService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CoursePreviewScreen = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseDoc = await getDoc(doc(firestore, "courses", courseId!));
      if (courseDoc.exists()) {
        setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
      }
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user?.uid || !courseId) return;

    try {
      setEnrolling(true);
      await enrollUser(user.uid, courseId);
      router.replace(`/courseDetail?courseId=${courseId}`);
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!course) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Typo>Course not found</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Typo size={24} fontWeight="bold" color={colors.white}>
            {course.title}
          </Typo>
          <View style={styles.difficultyContainer}>
            <Typo size={14} color={colors.textLight}>
              {course.difficulty} Level
            </Typo>
          </View>
        </View>

        <View style={styles.content}>
          <Typo size={16} color={colors.textLight} style={styles.description}>
            {course.description}
          </Typo>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Typo size={14} color={colors.textLight}>
                {course.duration}
              </Typo>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <Typo size={14} color={colors.textLight}>
                {course.lessons} Lessons
              </Typo>
            </View>
          </View>

          <View style={styles.topicsContainer}>
            <Typo
              size={18}
              fontWeight="600"
              color={colors.white}
              style={styles.sectionTitle}
            >
              What you ll learn
            </Typo>
            {course.topics.map((topic, index) => (
              <View key={index} style={styles.topicItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                />
                <Typo
                  size={14}
                  color={colors.textLight}
                  style={styles.topicText}
                >
                  {topic}
                </Typo>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button onPress={handleEnroll} loading={enrolling}>
          <Typo size={18} fontWeight="600" color={colors.neutral900}>
            {enrolling ? "Enrolling..." : "Let's Go!"}
          </Typo>
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default CoursePreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: spacingX._20,
    paddingTop: spacingY._10,
  },
  difficultyContainer: {
    marginTop: spacingY._10,
  },
  content: {
    padding: spacingX._20,
  },
  description: {
    lineHeight: 24,
    marginBottom: spacingY._25,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacingX._30,
    marginBottom: spacingY._30,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  topicsContainer: {
    marginBottom: spacingY._30,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    marginBottom: spacingY._10,
  },
  topicText: {
    flex: 1,
  },
  footer: {
    padding: spacingX._20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
  },
});
