import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { Quiz } from "@/types";
import {
  getLectureQuiz,
  getUserQuizAttempts,
  submitQuizAttempt,
  updateLectureProgress,
} from "@/utils/courseService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

type LectureStep = {
  id: string;
  text: string;
  isLastStep?: boolean;
  hasQuiz?: boolean;
};

type LectureData = {
  id: string;
  title: string;
  totalSteps: number;
  steps: LectureStep[];
  quiz?: Quiz;
};

const LectureScreen = () => {
  const { courseId, subCourseId, lectureId } = useLocalSearchParams<{
    courseId: string;
    subCourseId: string;
    lectureId: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(0);
  const [lectureData, setLectureData] = useState<LectureData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizFailure, setShowQuizFailure] = useState(false);
  const [showQuizExhausted, setShowQuizExhausted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userQuizAttempts, setUserQuizAttempts] = useState<{
    attempts: number;
    passed: boolean;
    lastScore: number;
  } | null>(null);

  useEffect(() => {
    if (lectureId && user?.uid) {
      loadLectureData();
    }
  }, [lectureId, user?.uid]);

  const loadLectureData = async () => {
    try {
      // Load lecture content
      const data = getLectureData(lectureId);
      setLectureData(data);

      // Load quiz if exists
      if (data.steps.some((step) => step.hasQuiz)) {
        const quizData = await getLectureQuiz(courseId, subCourseId, lectureId);
        setQuiz(quizData);

        // Get user's quiz attempts
        if (user?.uid) {
          const attempts = await getUserQuizAttempts(user.uid, lectureId);
          setUserQuizAttempts(attempts);
        }
      }
    } catch (error) {
      console.error("Error loading lecture data:", error);
    }
  };

  const handleTapToContinue = () => {
    if (!lectureData) return;

    if (currentStep < lectureData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Check if lecture has quiz
      if (quiz && quiz.questions.length > 0) {
        setShowQuiz(true);
      } else {
        handleLectureComplete();
      }
    }
  };

  const handleNextStep = () => {
    if (!lectureData) return;

    if (currentStep < lectureData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // This is the last step
      if (quiz && quiz.questions.length > 0) {
        console.log("Lecture has quiz, showing quiz screen");
        setShowQuiz(true);
      } else {
        console.log("No quiz, completing lecture directly");
        handleLectureComplete();
      }
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const handleMoveToNextTopic = async () => {
    try {
      // Ensure the lecture completion is saved before navigating
      if (!user?.uid) {
        router.back();
        return;
      }

      console.log("Completing lecture and navigating back");

      // Double-check that the lecture is marked as completed
      await updateLectureProgress(
        user.uid,
        courseId,
        subCourseId,
        lectureId,
        true
      );
      console.log("Final lecture completion check done");

      // Navigate back immediately
      router.back();
    } catch (error) {
      console.error("Error in handleMoveToNextTopic:", error);
      router.back();
    }
  };

  const handleLectureComplete = async () => {
    if (!user?.uid) return;

    try {
      console.log("Marking lecture as completed");

      // Mark lecture as completed in backend
      const success = await updateLectureProgress(
        user.uid,
        courseId,
        subCourseId,
        lectureId,
        true
      );

      if (success) {
        console.log("Lecture marked as completed successfully");

        // Show completion results first
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - startTime) / 1000);
        setCompletionTime(timeSpent);
        setAccuracy(100); // No quiz, so 100% accuracy
        setShowResults(true);
      } else {
        console.error("Failed to mark lecture as completed");
        // Still navigate back even if update failed
        router.back();
      }
    } catch (error) {
      console.error("Error completing lecture:", error);
      // Navigate back on error
      router.back();
    }
  };

  const handleQuizComplete = async () => {
    if (!quiz || !user?.uid) return;

    try {
      const result = await submitQuizAttempt(
        user.uid,
        courseId,
        subCourseId,
        lectureId,
        quizAnswers,
        quiz
      );

      setAccuracy(result.score);
      setUserQuizAttempts({
        attempts: result.attempts,
        passed: result.passed,
        lastScore: result.score,
      });

      if (result.passed) {
        console.log("Quiz passed! Score:", result.score);
        // Calculate completion time
        const endTime = Date.now();
        const timeSpent = Math.floor((endTime - startTime) / 1000);
        setCompletionTime(timeSpent);
        setShowResults(true);
      } else {
        console.log(
          "Quiz failed. Score:",
          result.score,
          "Can retry:",
          result.canRetry
        );
        // Show retry option if available
        if (result.canRetry) {
          setShowQuizFailure(true);
        } else {
          // No more attempts, show failure message
          setShowQuizExhausted(true);
        }
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers([]);
    setShowQuizFailure(false);
    setShowQuizExhausted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (!lectureData) return 0;
    return ((currentStep + 1) / lectureData.totalSteps) * 100;
  };

  if (!lectureData) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Typo>Loading lecture...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  // Quiz failure screen
  if (showQuizFailure) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0f0f23", "#1a1a2e", "#16213e"]}
          style={styles.gradient}
        />

        <ScreenWrapper style={styles.screenWrapper}>
          <View style={styles.resultsContainer}>
            <Animated.View
              entering={FadeInUp.springify()}
              style={styles.resultsContent}
            >
              <View style={styles.failureIcon}>
                <Ionicons name="close-circle" size={80} color={colors.rose} />
              </View>

              <Typo
                size={28}
                fontWeight="800"
                color={colors.white}
                style={styles.congratsTitle}
              >
                Quiz Failed
              </Typo>

              <Typo
                size={18}
                color={colors.textLight}
                style={styles.congratsSubtitle}
              >
                You need {quiz?.passingScore}% to pass. You scored{" "}
                {Math.round(accuracy)}%
              </Typo>

              <View style={styles.attemptsInfo}>
                <Typo size={16} color={colors.textLight}>
                  Attempts: {userQuizAttempts?.attempts || 0} /{" "}
                  {quiz?.maxAttempts || 3}
                </Typo>
              </View>

              <TouchableOpacity
                style={styles.retryQuizButton}
                onPress={handleRetryQuiz}
              >
                <LinearGradient
                  colors={[colors.primary, "#8fbc8f"]}
                  style={styles.buttonGradient}
                >
                  <Typo size={18} fontWeight="600" color={colors.neutral900}>
                    Try Again
                  </Typo>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScreenWrapper>
      </View>
    );
  }

  // Quiz exhausted screen
  if (showQuizExhausted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0f0f23", "#1a1a2e", "#16213e"]}
          style={styles.gradient}
        />

        <ScreenWrapper style={styles.screenWrapper}>
          <View style={styles.resultsContainer}>
            <Animated.View
              entering={FadeInUp.springify()}
              style={styles.resultsContent}
            >
              <View style={styles.failureIcon}>
                <Ionicons name="ban" size={80} color={colors.rose} />
              </View>

              <Typo
                size={28}
                fontWeight="800"
                color={colors.white}
                style={styles.congratsTitle}
              >
                No More Attempts
              </Typo>

              <Typo
                size={18}
                color={colors.textLight}
                style={styles.congratsSubtitle}
              >
                You have used all attempts for this quiz. Please review the
                content and try again later.
              </Typo>

              <TouchableOpacity
                style={styles.backToCourseButton}
                onPress={() => router.back()}
              >
                <LinearGradient
                  colors={[colors.neutral600, colors.neutral700]}
                  style={styles.buttonGradient}
                >
                  <Typo size={18} fontWeight="600" color={colors.white}>
                    Back to Course
                  </Typo>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScreenWrapper>
      </View>
    );
  }

  // Results screen - show completion celebration
  if (showResults) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0f0f23", "#1a1a2e", "#16213e"]}
          style={styles.gradient}
        />

        <ScreenWrapper style={styles.screenWrapper}>
          <View style={styles.resultsContainer}>
            <Animated.View
              entering={FadeInUp.springify()}
              style={styles.resultsContent}
            >
              <View style={styles.celebrationIcon}>
                <Ionicons name="trophy" size={80} color={colors.primary} />
              </View>

              <Typo
                size={28}
                fontWeight="800"
                color={colors.white}
                style={styles.congratsTitle}
              >
                You did it!
              </Typo>

              <Typo
                size={18}
                color={colors.textLight}
                style={styles.congratsSubtitle}
              >
                That was a breeze for you
              </Typo>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Typo size={32} fontWeight="700" color={colors.primary}>
                    {Math.round(accuracy)}%
                  </Typo>
                  <Typo size={14} color={colors.textLight}>
                    Accuracy
                  </Typo>
                </View>

                <View style={styles.statBox}>
                  <Typo size={32} fontWeight="700" color={colors.primary}>
                    {formatTime(completionTime)}
                  </Typo>
                  <Typo size={14} color={colors.textLight}>
                    Time Spent
                  </Typo>
                </View>
              </View>

              <TouchableOpacity
                style={styles.nextTopicButton}
                onPress={handleMoveToNextTopic}
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
            </Animated.View>
          </View>
        </ScreenWrapper>
      </View>
    );
  }

  // Quiz screen
  if (showQuiz) {
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

            <Typo size={18} fontWeight="600" color={colors.white}>
              Quiz Time!
            </Typo>

            <View style={{ width: 40 }} />
          </Animated.View>

          <ScrollView style={styles.content}>
            {quiz?.questions.map((question, questionIndex) => (
              <Animated.View
                key={questionIndex}
                entering={FadeInDown.delay(questionIndex * 200).springify()}
                style={styles.quizQuestion}
              >
                <Typo
                  size={18}
                  fontWeight="600"
                  color={colors.white}
                  style={styles.questionText}
                >
                  {questionIndex + 1}. {question.question}
                </Typo>

                {question.options.map((option, optionIndex) => (
                  <TouchableOpacity
                    key={optionIndex}
                    style={[
                      styles.quizOption,
                      quizAnswers[questionIndex] === optionIndex &&
                        styles.selectedOption,
                    ]}
                    onPress={() => handleQuizAnswer(questionIndex, optionIndex)}
                  >
                    <Typo
                      size={16}
                      color={
                        quizAnswers[questionIndex] === optionIndex
                          ? colors.neutral900
                          : colors.white
                      }
                    >
                      {option}
                    </Typo>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            ))}

            {quizAnswers.length === quiz?.questions.length && (
              <Animated.View
                entering={FadeInUp.springify()}
                style={styles.quizSubmitContainer}
              >
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleQuizComplete}
                >
                  <LinearGradient
                    colors={[colors.primary, "#8fbc8f"]}
                    style={styles.buttonGradient}
                  >
                    <Typo size={18} fontWeight="600" color={colors.neutral900}>
                      Submit Quiz
                    </Typo>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </ScreenWrapper>
      </View>
    );
  }

  // Main lecture content
  const currentStepData = lectureData.steps[currentStep];

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
            style={styles.lectureTitle}
          >
            {lectureData.title}
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
                strokeDasharray={`${getProgressPercentage() * 1.005} 100.5`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </Svg>
            <View style={styles.progressText}>
              <Typo size={8} fontWeight="600" color={colors.white}>
                {Math.round(getProgressPercentage())}%
              </Typo>
            </View>
          </View>
        </Animated.View>

        {/* Progress Bar */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.progressBarContainer}
        >
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: `${getProgressPercentage()}%` },
              ]}
            />
          </View>
          <Typo size={12} color={colors.textLight}>
            Step {currentStep + 1} of {lectureData.totalSteps}
          </Typo>
        </Animated.View>

        {/* Content */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.content}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.textContainer}>
              <Typo
                size={18}
                color={colors.white}
                style={styles.lectureContent}
              >
                {currentStepData.text}
              </Typo>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Action Button */}
        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={styles.actionContainer}
        >
          {currentStepData.isLastStep ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNextStep}
            >
              <LinearGradient
                colors={[colors.primary, "#8fbc8f"]}
                style={styles.buttonGradient}
              >
                <Typo size={18} fontWeight="600" color={colors.neutral900}>
                  Next
                </Typo>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.tapToContinue}
              onPress={handleTapToContinue}
            >
              <Typo size={16} color={colors.primary} fontWeight="600">
                Tap to continue
              </Typo>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScreenWrapper>
    </View>
  );
};

// Mock function to get lecture data
const getLectureData = (lectureId: string): LectureData => {
  const lectureDataMap: Record<string, LectureData> = {
    "what-is-python": {
      id: "what-is-python",
      title: "What is Python?",
      totalSteps: 4,
      steps: [
        {
          id: "step1",
          text: "Python is a high-level, interpreted programming language that emphasizes code readability and simplicity.",
        },
        {
          id: "step2",
          text: "Created by Guido van Rossum and first released in 1991, Python has become one of the most popular programming languages in the world.",
        },
        {
          id: "step3",
          text: "Python's philosophy emphasizes that code should be readable and that programmers should be able to express concepts in fewer lines of code.",
        },
        {
          id: "step4",
          text: "With its clean syntax and powerful libraries, Python is perfect for beginners while being robust enough for complex applications.",
          isLastStep: true,
          hasQuiz: true,
        },
      ],
    },
    "python-uses": {
      id: "python-uses",
      title: "Where is Python used?",
      totalSteps: 5,
      steps: [
        {
          id: "step1",
          text: "Python finds its applications in various domains due to its versatility and ease of use.",
        },
        {
          id: "step2",
          text: "Let's see some specific scenarios where Python is used in the real world.",
        },
        {
          id: "step3",
          text: "Python is used to create web applications using frameworks like Django and Flask.",
          isLastStep: true,
        },
        {
          id: "step4",
          text: "Data Science and Machine Learning rely heavily on Python with libraries like NumPy, Pandas, and TensorFlow.",
          isLastStep: true,
        },
        {
          id: "step5",
          text: "Automation, scripting, game development, and desktop applications are other popular uses of Python.",
          isLastStep: true,
          hasQuiz: true,
        },
      ],
    },
  };

  return (
    lectureDataMap[lectureId] || {
      id: lectureId,
      title: "Sample Lecture",
      totalSteps: 1,
      steps: [
        {
          id: "step1",
          text: "This is a sample lecture content. More content will be available soon.",
          isLastStep: true,
        },
      ],
    }
  );
};

export default LectureScreen;

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
    padding: spacingX._10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  lectureTitle: {
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
  progressBarContainer: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._20,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    borderRadius: 2,
    marginBottom: spacingY._5,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  lectureContent: {
    textAlign: "center",
    lineHeight: 28,
  },
  actionContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
    alignItems: "center",
  },
  tapToContinue: {
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._30,
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  buttonGradient: {
    paddingVertical: spacingY._15,
    alignItems: "center",
  },
  // Quiz styles
  quizQuestion: {
    marginBottom: spacingY._25,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: spacingX._20,
  },
  questionText: {
    marginBottom: spacingY._15,
  },
  quizOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: spacingX._15,
    marginBottom: spacingY._10,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quizSubmitContainer: {
    marginTop: spacingY._20,
    marginBottom: spacingY._30,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  // Results styles
  resultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
  },
  resultsContent: {
    alignItems: "center",
    width: "100%",
  },
  celebrationIcon: {
    marginBottom: spacingY._20,
  },
  congratsTitle: {
    marginBottom: spacingY._10,
    textAlign: "center",
  },
  congratsSubtitle: {
    marginBottom: spacingY._30,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: spacingY._30,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: spacingX._20,
    minWidth: 120,
  },
  nextTopicButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  // Failure styles
  failureIcon: {
    marginBottom: spacingY._20,
  },
  attemptsInfo: {
    marginBottom: spacingY._20,
    padding: spacingX._15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  retryQuizButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  backToCourseButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
});
