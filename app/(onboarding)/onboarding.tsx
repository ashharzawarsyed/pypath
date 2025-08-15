import Button from "@/components/Button";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
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
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";
import Swiper from "react-native-swiper";

const { width, height } = Dimensions.get("window");

// Sample avatar data for testimonials
const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    avatar: "👩‍💻",
    rating: 5,
    quote:
      "PyPath helped me transition from marketing to tech. The structured learning path was perfect!",
  },
  {
    name: "Marcus Johnson",
    role: "Data Scientist at Microsoft",
    avatar: "👨‍🔬",
    rating: 5,
    quote:
      "Got my dream job after completing the advanced Python course. Highly recommended!",
  },
  {
    name: "Elena Rodriguez",
    role: "AI Researcher at OpenAI",
    avatar: "👩‍🔬",
    rating: 5,
    quote:
      "The expert-backed curriculum is outstanding. Every concept is explained clearly.",
  },
];

const companies = [
  { name: "Google", icon: "🔍" },
  { name: "Microsoft", icon: "Ⓜ️" },
  { name: "Apple", icon: "🍎" },
  { name: "Meta", icon: "📘" },
  { name: "Netflix", icon: "🎬" },
  { name: "Tesla", icon: "⚡" },
];

const Onboarding = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef<Swiper>(null);
  const insets = useSafeAreaInsets();

  // Animation values
  const floatingAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);
  const rotateAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    // Floating animation
    floatingAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Scale animation
    scaleAnimation.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Rotate animation
    rotateAnimation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse animation
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(floatingAnimation.value, [0, 1], [-10, 10]),
        },
      ],
    };
  });

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnimation.value }],
    };
  });

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateAnimation.value}deg` }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnimation.value }],
    };
  });

  const handleGetStarted = () => {
    router.push("/chooseOption");
  };

  const handleNext = () => {
    if (currentIndex < 2) {
      swiperRef.current?.scrollTo(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const renderSlide1 = () => (
    <View style={styles.slide}>
      <ScrollView
        contentContainerStyle={styles.slideScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Background Elements */}
        <Animated.View
          style={[styles.backgroundElement, styles.element1, rotateStyle]}
        >
          <Svg width="100" height="100" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="grad1" cx="50%" cy="50%" r="50%">
                <Stop
                  offset="0%"
                  stopColor={colors.primary}
                  stopOpacity="0.3"
                />
                <Stop
                  offset="100%"
                  stopColor={colors.primary}
                  stopOpacity="0.1"
                />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="40" fill="url(#grad1)" />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[styles.backgroundElement, styles.element2, floatingStyle]}
        >
          <Svg width="60" height="60" viewBox="0 0 60 60">
            <Path
              d="M30,10 L40,25 L30,40 L20,25 Z"
              fill={colors.primary}
              opacity="0.2"
            />
          </Svg>
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          entering={FadeInUp.delay(300)}
          style={styles.contentContainer}
        >
          <Animated.View style={[styles.iconContainer, scaleStyle]}>
            <LinearGradient
              colors={[colors.primary, "#8fbc8f"]}
              style={styles.iconGradient}
            >
              <Ionicons name="people" size={60} color={colors.neutral900} />
            </LinearGradient>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(500)}
            style={styles.textSection}
          >
            <Typo
              size={32}
              fontWeight="800"
              color={colors.white}
              style={styles.title}
            >
              Trusted by
            </Typo>
            <Typo
              size={32}
              fontWeight="800"
              color={colors.primary}
              style={styles.titleAccent}
            >
              Millions
            </Typo>
            <Typo size={16} color={colors.neutral300} style={styles.subtitle}>
              Join over 5 million learners who have transformed their careers
              with PyPath
            </Typo>
          </Animated.View>

          {/* User Avatars */}
          <Animated.View
            entering={FadeInUp.delay(700)}
            style={styles.avatarsContainer}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <Animated.View
                key={index}
                entering={FadeInLeft.delay(800 + index * 100).springify()}
                style={[
                  styles.avatar,
                  { zIndex: 5 - index },
                  index > 0 && { marginLeft: -15 },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, "#8fbc8f"]}
                  style={styles.avatarGradient}
                >
                  <Typo size={20}>{["👨‍💻", "👩‍💼", "👨‍🔬", "👩‍🎨", "👨‍🚀"][index]}</Typo>
                </LinearGradient>
              </Animated.View>
            ))}
            <Animated.View
              entering={FadeInRight.delay(1300).springify()}
              style={styles.moreCount}
            >
              <Typo size={12} fontWeight="600" color={colors.primary}>
                +5M
              </Typo>
            </Animated.View>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            entering={FadeInUp.delay(900)}
            style={styles.statsContainer}
          >
            <View style={styles.statItem}>
              <Typo size={24} fontWeight="800" color={colors.primary}>
                5M+
              </Typo>
              <Typo size={12} color={colors.neutral400}>
                Students
              </Typo>
            </View>
            <View style={styles.statItem}>
              <Typo size={24} fontWeight="800" color={colors.primary}>
                98%
              </Typo>
              <Typo size={12} color={colors.neutral400}>
                Success Rate
              </Typo>
            </View>
            <View style={styles.statItem}>
              <Typo size={24} fontWeight="800" color={colors.primary}>
                4.9⭐
              </Typo>
              <Typo size={12} color={colors.neutral400}>
                Rating
              </Typo>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );

  const renderSlide2 = () => (
    <View style={styles.slide}>
      <ScrollView
        contentContainerStyle={styles.slideScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Background Elements */}
        <Animated.View
          style={[styles.backgroundElement, styles.element3, pulseStyle]}
        >
          <Svg width="80" height="80" viewBox="0 0 80 80">
            <Defs>
              <RadialGradient id="grad2" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
              </RadialGradient>
            </Defs>
            <Path d="M40,10 L60,30 L40,50 L20,30 Z" fill="url(#grad2)" />
          </Svg>
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          entering={FadeInUp.delay(300)}
          style={styles.contentContainer}
        >
          <Animated.View style={[styles.iconContainer, floatingStyle]}>
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              style={styles.iconGradient}
            >
              <Ionicons name="briefcase" size={60} color={colors.white} />
            </LinearGradient>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(500)}
            style={styles.textSection}
          >
            <Typo
              size={32}
              fontWeight="800"
              color={colors.white}
              style={styles.title}
            >
              Get
            </Typo>
            <Typo
              size={32}
              fontWeight="800"
              color="#22c55e"
              style={styles.titleAccent}
            >
              Job Ready
            </Typo>
            <Typo size={16} color={colors.neutral300} style={styles.subtitle}>
              Build real-world projects and gain the skills top companies are
              looking for
            </Typo>
          </Animated.View>

          {/* Company Logos */}
          <Animated.View
            entering={FadeInUp.delay(700)}
            style={styles.companiesContainer}
          >
            <Typo
              size={14}
              fontWeight="600"
              color={colors.neutral400}
              style={styles.companiesTitle}
            >
              Our students work at:
            </Typo>
            <View style={styles.companiesGrid}>
              {companies.map((company, index) => (
                <Animated.View
                  key={company.name}
                  entering={FadeInDown.delay(800 + index * 100).springify()}
                  style={styles.companyItem}
                >
                  <View style={styles.companyIcon}>
                    <Typo size={20}>{company.icon}</Typo>
                  </View>
                  <Typo size={10} color={colors.neutral500}>
                    {company.name}
                  </Typo>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Job Success Stats */}
          <Animated.View
            entering={FadeInUp.delay(1100)}
            style={styles.jobStats}
          >
            <View style={styles.jobStatItem}>
              <Typo size={20} fontWeight="800" color="#22c55e">
                89%
              </Typo>
              <Typo size={12} color={colors.neutral400}>
                Get job offers
              </Typo>
            </View>
            <View style={styles.jobStatItem}>
              <Typo size={20} fontWeight="800" color="#22c55e">
                $75k
              </Typo>
              <Typo size={12} color={colors.neutral400}>
                Avg. salary
              </Typo>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );

  const renderSlide3 = () => (
    <View style={styles.slide}>
      <ScrollView
        contentContainerStyle={styles.slideScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Background Elements */}
        <Animated.View
          style={[styles.backgroundElement, styles.element4, scaleStyle]}
        >
          <Svg width="120" height="120" viewBox="0 0 120 120">
            <Defs>
              <RadialGradient id="grad3" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </RadialGradient>
            </Defs>
            <Circle cx="60" cy="60" r="50" fill="url(#grad3)" />
          </Svg>
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          entering={FadeInUp.delay(300)}
          style={styles.contentContainer}
        >
          <Animated.View style={[styles.iconContainer, pulseStyle]}>
            <LinearGradient
              colors={["#3b82f6", "#1d4ed8"]}
              style={styles.iconGradient}
            >
              <Ionicons name="school" size={60} color={colors.white} />
            </LinearGradient>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(500)}
            style={styles.textSection}
          >
            <Typo
              size={32}
              fontWeight="800"
              color={colors.white}
              style={styles.title}
            >
              Expert
            </Typo>
            <Typo
              size={32}
              fontWeight="800"
              color="#3b82f6"
              style={styles.titleAccent}
            >
              Backed
            </Typo>
            <Typo size={16} color={colors.neutral300} style={styles.subtitle}>
              Learn from Google engineers and industry professionals who've
              built the future
            </Typo>
          </Animated.View>

          {/* Expert Testimonials */}
          <Animated.View
            entering={FadeInUp.delay(700)}
            style={styles.testimonialsContainer}
          >
            {testimonials.map((testimonial, index) => (
              <Animated.View
                key={testimonial.name}
                entering={FadeInLeft.delay(800 + index * 200).springify()}
                style={styles.testimonialCard}
              >
                <View style={styles.testimonialHeader}>
                  <View style={styles.testimonialAvatar}>
                    <Typo size={20}>{testimonial.avatar}</Typo>
                  </View>
                  <View style={styles.testimonialInfo}>
                    <Typo size={12} fontWeight="600" color={colors.white}>
                      {testimonial.name}
                    </Typo>
                    <Typo size={10} color={colors.neutral400}>
                      {testimonial.role}
                    </Typo>
                  </View>
                  <View style={styles.rating}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Typo key={i} size={10}>
                        ⭐
                      </Typo>
                    ))}
                  </View>
                </View>
                <Typo size={11} color={colors.neutral300} style={styles.quote}>
                  "{testimonial.quote}"
                </Typo>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Google Partnership Badge */}
          <Animated.View
            entering={FadeInUp.delay(1400)}
            style={styles.partnershipBadge}
          >
            <View style={styles.googleBadge}>
              <Typo size={16}>🔍</Typo>
              <Typo size={12} fontWeight="600" color={colors.white}>
                Google Partner
              </Typo>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={["#0f0f23", "#1a1a2e", "#16213e"]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScreenWrapper style={styles.screenWrapper}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={[
              styles.header,
              { paddingTop: insets.top > 0 ? 0 : spacingY._10 },
            ]}
          >
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Typo size={14} color={colors.neutral400}>
                Skip
              </Typo>
            </TouchableOpacity>
          </Animated.View>

          {/* Swiper */}
          <View style={styles.swiperContainer}>
            <Swiper
              ref={swiperRef}
              style={styles.wrapper}
              loop={false}
              onIndexChanged={(index) => setCurrentIndex(index)}
              showsPagination={false}
            >
              {renderSlide1()}
              {renderSlide2()}
              {renderSlide3()}
            </Swiper>
          </View>

          {/* Bottom Navigation */}
          <Animated.View
            entering={FadeInUp.delay(400)}
            style={[
              styles.bottomContainer,
              { paddingBottom: insets.bottom + spacingY._20 },
            ]}
          >
            <Button onPress={handleNext} style={styles.button}>
              <Typo size={16} color={colors.neutral900} fontWeight="700">
                {currentIndex === 2 ? "Get Started" : "Next"}
              </Typo>
              <Ionicons
                name={currentIndex === 2 ? "rocket" : "arrow-forward"}
                size={20}
                color={colors.neutral900}
                style={{ marginLeft: 8 }}
              />
            </Button>
          </Animated.View>
        </ScreenWrapper>
      </SafeAreaView>
    </View>
  );
};

export default Onboarding;

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
  safeArea: {
    flex: 1,
  },
  screenWrapper: {
    backgroundColor: "transparent",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacingX._20,
    zIndex: 10,
  },
  skipButton: {
    padding: spacingX._10,
  },
  swiperContainer: {
    flex: 1,
  },
  wrapper: {},
  slide: {
    flex: 1,
  },
  slideScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    minHeight: height * 0.75, // Ensure minimum height
  },
  backgroundElement: {
    position: "absolute",
    zIndex: 0,
  },
  element1: {
    top: "5%",
    right: "10%",
  },
  element2: {
    top: "15%",
    left: "15%",
  },
  element3: {
    top: "10%",
    right: "20%",
  },
  element4: {
    top: "20%",
    left: "10%",
  },
  contentContainer: {
    alignItems: "center",
    zIndex: 1,
    width: "100%",
  },
  iconContainer: {
    marginBottom: spacingY._25,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  textSection: {
    alignItems: "center",
    marginBottom: spacingY._25,
  },
  title: {
    textAlign: "center",
    marginBottom: spacingY._5,
  },
  titleAccent: {
    textAlign: "center",
    marginBottom: spacingY._15,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacingX._10,
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 3,
    borderColor: colors.neutral800,
  },
  avatarGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
  },
  moreCount: {
    marginLeft: spacingX._15,
    backgroundColor: "rgba(163, 230, 53, 0.2)",
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._5,
    borderRadius: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._15,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  companiesContainer: {
    alignItems: "center",
    marginBottom: spacingY._20,
    width: "100%",
  },
  companiesTitle: {
    marginBottom: spacingY._15,
  },
  companiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    maxWidth: "100%",
  },
  companyItem: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: spacingX._8,
    minWidth: 55,
  },
  companyIcon: {
    marginBottom: spacingY._5,
  },
  jobStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 20,
    paddingVertical: spacingY._15,
  },
  jobStatItem: {
    alignItems: "center",
    flex: 1,
  },
  testimonialsContainer: {
    width: "100%",
    marginBottom: spacingY._20,
  },
  testimonialCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: spacingX._15,
    marginBottom: spacingY._10,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  testimonialAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._10,
  },
  testimonialInfo: {
    flex: 1,
  },
  rating: {
    flexDirection: "row",
  },
  quote: {
    fontStyle: "italic",
    lineHeight: 16,
  },
  partnershipBadge: {
    alignItems: "center",
  },
  googleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderRadius: 20,
    gap: spacingX._10,
  },
  bottomContainer: {
    paddingHorizontal: spacingX._25,
    paddingTop: spacingY._10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});
