import { firestore } from "@/config/firebase";
import { Course, UserEnrollment } from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";

// Predefined Python courses for Firestore seeding
const PYTHON_COURSES: Course[] = [
  {
    id: "python-basics",
    title: "Python Fundamentals",
    description:
      "Master the building blocks of Python programming with hands-on exercises and real-world projects.",
    difficulty: "Beginner",
    duration: "4 weeks",
    lessons: 24,
    topics: [
      "Variables and Data Types",
      "Control Structures",
      "Functions and Modules",
      "File Handling",
      "Error Handling",
    ],
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
    topics: [
      "Classes and Objects",
      "Inheritance and Polymorphism",
      "Decorators and Generators",
      "Context Managers",
      "Database Integration",
    ],
    isPopular: false,
    createdAt: new Date(),
  },
  {
    id: "python-advanced",
    title: "Advanced Python Mastery",
    description:
      "Explore metaclasses, async programming, and performance optimization techniques for expert-level development.",
    difficulty: "Advanced",
    duration: "8 weeks",
    lessons: 28,
    topics: [
      "Metaclasses and Descriptors",
      "Async Programming",
      "Performance Optimization",
      "Memory Management",
      "Advanced Testing Patterns",
    ],
    isPopular: false,
    createdAt: new Date(),
  },
  {
    id: "python-ml-ai",
    title: "Python for AI & Machine Learning",
    description:
      "Build intelligent applications using NumPy, Pandas, Scikit-learn, and TensorFlow for real-world AI solutions.",
    difficulty: "Advanced",
    duration: "12 weeks",
    lessons: 45,
    topics: [
      "NumPy and Pandas Mastery",
      "Data Visualization",
      "Machine Learning Algorithms",
      "Deep Learning with TensorFlow",
      "AI Project Development",
    ],
    isPopular: true,
    createdAt: new Date(),
  },
];

export const fetchCourses = async (): Promise<Course[]> => {
  try {
    // Fetch courses from Firestore with caching strategy
    const coursesRef = collection(firestore, "courses");
    const q = query(coursesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Seed Firestore with default courses if empty
      console.log("No courses found, creating default Python courses...");
      await createDefaultCourses();
      return PYTHON_COURSES;
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  } catch (error) {
    console.error("Error fetching courses:", error);
    // Fallback to mock data if Firestore fails
    return PYTHON_COURSES;
  }
};

const createDefaultCourses = async (): Promise<void> => {
  try {
    const promises = PYTHON_COURSES.map(async (course) => {
      const courseRef = doc(firestore, "courses", course.id);
      await setDoc(courseRef, course);
    });

    await Promise.all(promises);
    console.log("Default Python courses created successfully");
  } catch (error) {
    console.error("Error creating default courses:", error);
  }
};

export const isUserEnrolled = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const enrollmentRef = doc(
      firestore,
      "enrollments",
      `${userId}_${courseId}`
    );
    const enrollmentDoc = await getDoc(enrollmentRef);
    return enrollmentDoc.exists();
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return false;
  }
};

export const enrollUser = async (
  userId: string,
  courseId: string
): Promise<void> => {
  try {
    const enrollmentData: UserEnrollment = {
      userId,
      courseId,
      enrolledAt: new Date(),
      progress: 0,
      currentLesson: 1,
      completed: false,
    };

    const enrollmentRef = doc(
      firestore,
      "enrollments",
      `${userId}_${courseId}`
    );
    await setDoc(enrollmentRef, enrollmentData);

    console.log("User enrolled successfully:", { userId, courseId });
  } catch (error) {
    console.error("Error enrolling user:", error);
    throw error;
  }
};

export const getUserEnrollments = async (
  userId: string
): Promise<UserEnrollment[]> => {
  try {
    const enrollmentsRef = collection(firestore, "enrollments");
    const q = query(enrollmentsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as UserEnrollment[];
  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    throw error;
  }
};
