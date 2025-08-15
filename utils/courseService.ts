import { firestore } from "@/config/firebase";
import { Course, Lecture, Quiz, SubCourse, UserEnrollment } from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// Difficulty order for sorting
const DIFFICULTY_ORDER = { Beginner: 1, Intermediate: 2, Advanced: 3 };

// Fetch all courses from Firestore with difficulty-based sorting
export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = collection(firestore, "courses");
    const querySnapshot = await getDocs(coursesRef);

    const courses: Course[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      courses.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        duration: data.duration,
        lessons: data.lessons,
        image: data.image,
        topics: data.topics || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        isPopular: data.isPopular || false,
      });
    });

    // Sort by difficulty (Beginner -> Intermediate -> Advanced)
    const sortedCourses = courses.sort((a, b) => {
      const difficultyA = DIFFICULTY_ORDER[a.difficulty];
      const difficultyB = DIFFICULTY_ORDER[b.difficulty];

      if (difficultyA !== difficultyB) {
        return difficultyA - difficultyB;
      }

      // If same difficulty, sort by popularity first, then by creation date
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;

      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });

    return sortedCourses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

// Fetch a single course by ID
export const fetchCourseById = async (
  courseId: string
): Promise<Course | null> => {
  try {
    const courseRef = doc(firestore, "courses", courseId);
    const courseSnap = await getDoc(courseRef);

    if (courseSnap.exists()) {
      const data = courseSnap.data();
      return {
        id: courseSnap.id,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        duration: data.duration,
        lessons: data.lessons,
        image: data.image,
        topics: data.topics || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        isPopular: data.isPopular || false,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
};

// Check if user is enrolled in a course
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
    const enrollmentSnap = await getDoc(enrollmentRef);
    return enrollmentSnap.exists();
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return false;
  }
};

// Enroll user in a course
export const enrollUserInCourse = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
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

    return true;
  } catch (error) {
    console.error("Error enrolling user:", error);
    return false;
  }
};

// Get user's enrolled courses
export const getUserEnrolledCourses = async (
  userId: string
): Promise<Course[]> => {
  try {
    const enrollmentsRef = collection(firestore, "enrollments");
    const q = query(enrollmentsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const courseIds: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      courseIds.push(data.courseId);
    });

    // Fetch course details for enrolled courses
    const enrolledCourses: Course[] = [];
    for (const courseId of courseIds) {
      const course = await fetchCourseById(courseId);
      if (course) {
        enrolledCourses.push(course);
      }
    }

    return enrolledCourses;
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return [];
  }
};

// Update user's progress in a course
export const updateCourseProgress = async (
  userId: string,
  courseId: string,
  progress: number,
  currentLesson: number
): Promise<boolean> => {
  try {
    const enrollmentRef = doc(
      firestore,
      "enrollments",
      `${userId}_${courseId}`
    );
    await updateDoc(enrollmentRef, {
      progress,
      currentLesson,
      completed: progress >= 100,
    });

    return true;
  } catch (error) {
    console.error("Error updating progress:", error);
    return false;
  }
};

// Get user's progress for a specific course
export const getCourseProgress = async (
  userId: string,
  courseId: string
): Promise<number> => {
  try {
    const enrollmentRef = doc(
      firestore,
      "enrollments",
      `${userId}_${courseId}`
    );
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (enrollmentSnap.exists()) {
      const data = enrollmentSnap.data();
      return data.progress || 0;
    }

    return 0;
  } catch (error) {
    console.error("Error getting course progress:", error);
    return 0;
  }
};

// Update lecture completion with better error handling and logging
export const updateLectureProgress = async (
  userId: string,
  courseId: string,
  subCourseId: string,
  lectureId: string,
  completed: boolean
): Promise<boolean> => {
  try {
    console.log("Updating lecture progress:", {
      userId,
      courseId,
      subCourseId,
      lectureId,
      completed,
    });

    const progressRef = doc(firestore, "userProgress", `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);

    let progressData = {
      userId,
      courseId,
      completedLectures: [] as string[],
      completedSubCourses: [] as string[],
      progress: 0,
      lastAccessedAt: new Date(),
    };

    if (progressSnap.exists()) {
      const existingData = progressSnap.data();
      progressData = {
        ...progressData,
        completedLectures: existingData.completedLectures || [],
        completedSubCourses: existingData.completedSubCourses || [],
        progress: existingData.progress || 0,
      };
    }

    console.log("Current progress data:", progressData);

    // Update completed lectures
    if (completed && !progressData.completedLectures.includes(lectureId)) {
      progressData.completedLectures.push(lectureId);
      console.log("Added lecture to completed:", lectureId);
    } else if (!completed) {
      progressData.completedLectures = progressData.completedLectures.filter(
        (id) => id !== lectureId
      );
      console.log("Removed lecture from completed:", lectureId);
    }

    // Calculate overall progress
    const totalLectures = await getTotalLecturesCount(courseId);
    progressData.progress =
      (progressData.completedLectures.length / totalLectures) * 100;

    console.log(
      "New progress:",
      progressData.progress,
      "Completed lectures:",
      progressData.completedLectures.length,
      "Total:",
      totalLectures
    );

    await setDoc(progressRef, progressData);
    console.log("Progress data saved to Firestore");

    // Also update enrollment progress
    const enrollmentRef = doc(
      firestore,
      "enrollments",
      `${userId}_${courseId}`
    );
    await updateDoc(enrollmentRef, {
      progress: progressData.progress,
      completed: progressData.progress >= 100,
    });

    console.log("Enrollment progress updated");
    return true;
  } catch (error) {
    console.error("Error updating lecture progress:", error);
    return false;
  }
};

// Mock data functions for fallback - Enhanced with comprehensive content
const getMockSubCourses = (userId?: string): SubCourse[] => {
  console.log("Creating mock sub-courses for userId:", userId);

  const mockSubCourses = [
    {
      id: "intro-python",
      title: "Python Fundamentals",
      duration: "2 hours",
      completed: false,
      lectures: [
        {
          id: "what-is-python",
          title: "What is Python?",
          duration: "15 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: false,
        },
        {
          id: "python-installation",
          title: "Installing Python & IDE Setup",
          duration: "20 min",
          completed: false,
          order: 2,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "python-syntax",
          title: "Python Syntax Basics",
          duration: "25 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "comments-and-documentation",
          title: "Comments & Documentation",
          duration: "15 min",
          completed: false,
          order: 4,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "python-interpreter",
          title: "Understanding Python Interpreter",
          duration: "20 min",
          completed: false,
          order: 5,
          hasQuiz: true,
          isLocked: true,
        },
      ],
      order: 1,
      isLocked: false,
    },
    {
      id: "variables-data-types",
      title: "Variables & Data Types",
      duration: "2.5 hours",
      completed: false,
      lectures: [
        {
          id: "variables-basics",
          title: "Variables and Assignment",
          duration: "20 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "numbers-integers-floats",
          title: "Numbers: Integers & Floats",
          duration: "25 min",
          completed: false,
          order: 2,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "strings-manipulation",
          title: "Strings & String Manipulation",
          duration: "30 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "booleans-none",
          title: "Booleans & None Type",
          duration: "15 min",
          completed: false,
          order: 4,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "type-conversion",
          title: "Type Conversion & Casting",
          duration: "20 min",
          completed: false,
          order: 5,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "input-output",
          title: "User Input & Output",
          duration: "25 min",
          completed: false,
          order: 6,
          hasQuiz: false,
          isLocked: true,
        },
      ],
      order: 2,
      isLocked: true,
    },
    {
      id: "operators-expressions",
      title: "Operators & Expressions",
      duration: "1.5 hours",
      completed: false,
      lectures: [
        {
          id: "arithmetic-operators",
          title: "Arithmetic Operators",
          duration: "20 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "comparison-operators",
          title: "Comparison Operators",
          duration: "15 min",
          completed: false,
          order: 2,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "logical-operators",
          title: "Logical Operators",
          duration: "20 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "assignment-operators",
          title: "Assignment Operators",
          duration: "15 min",
          completed: false,
          order: 4,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "operator-precedence",
          title: "Operator Precedence",
          duration: "20 min",
          completed: false,
          order: 5,
          hasQuiz: true,
          isLocked: true,
        },
      ],
      order: 3,
      isLocked: true,
    },
    {
      id: "control-structures",
      title: "Control Flow Structures",
      duration: "3 hours",
      completed: false,
      lectures: [
        {
          id: "if-statements",
          title: "If Statements & Conditions",
          duration: "25 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "elif-else",
          title: "Elif & Else Statements",
          duration: "20 min",
          completed: false,
          order: 2,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "nested-conditions",
          title: "Nested Conditional Statements",
          duration: "25 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "for-loops",
          title: "For Loops & Iteration",
          duration: "30 min",
          completed: false,
          order: 4,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "while-loops",
          title: "While Loops",
          duration: "25 min",
          completed: false,
          order: 5,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "loop-control",
          title: "Break, Continue & Pass",
          duration: "20 min",
          completed: false,
          order: 6,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "nested-loops",
          title: "Nested Loops",
          duration: "25 min",
          completed: false,
          order: 7,
          hasQuiz: true,
          isLocked: true,
        },
      ],
      order: 4,
      isLocked: true,
    },
    {
      id: "data-structures",
      title: "Data Structures",
      duration: "4 hours",
      completed: false,
      lectures: [
        {
          id: "lists-basics",
          title: "Lists: Creation & Basic Operations",
          duration: "30 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "list-methods",
          title: "List Methods & Manipulation",
          duration: "35 min",
          completed: false,
          order: 2,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "tuples",
          title: "Tuples: Immutable Sequences",
          duration: "25 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "dictionaries",
          title: "Dictionaries: Key-Value Pairs",
          duration: "35 min",
          completed: false,
          order: 4,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "sets",
          title: "Sets: Unique Collections",
          duration: "25 min",
          completed: false,
          order: 5,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "list-comprehensions",
          title: "List Comprehensions",
          duration: "30 min",
          completed: false,
          order: 6,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "data-structure-choice",
          title: "Choosing the Right Data Structure",
          duration: "20 min",
          completed: false,
          order: 7,
          hasQuiz: false,
          isLocked: true,
        },
      ],
      order: 5,
      isLocked: true,
    },
    {
      id: "functions",
      title: "Functions & Modules",
      duration: "3.5 hours",
      completed: false,
      lectures: [
        {
          id: "function-basics",
          title: "Function Definition & Calling",
          duration: "25 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "parameters-arguments",
          title: "Parameters & Arguments",
          duration: "30 min",
          completed: false,
          order: 2,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "return-values",
          title: "Return Values & Return Statement",
          duration: "20 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "scope-variables",
          title: "Variable Scope & Local vs Global",
          duration: "25 min",
          completed: false,
          order: 4,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "lambda-functions",
          title: "Lambda Functions",
          duration: "20 min",
          completed: false,
          order: 5,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "modules-import",
          title: "Modules & Import Statements",
          duration: "30 min",
          completed: false,
          order: 6,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "standard-library",
          title: "Python Standard Library Overview",
          duration: "35 min",
          completed: false,
          order: 7,
          hasQuiz: false,
          isLocked: true,
        },
      ],
      order: 6,
      isLocked: true,
    },
    {
      id: "error-handling",
      title: "Error Handling & Debugging",
      duration: "2 hours",
      completed: false,
      lectures: [
        {
          id: "understanding-errors",
          title: "Understanding Python Errors",
          duration: "20 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "try-except",
          title: "Try-Except Blocks",
          duration: "25 min",
          completed: false,
          order: 2,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "exception-types",
          title: "Exception Types & Handling",
          duration: "20 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "finally-else",
          title: "Finally & Else in Exception Handling",
          duration: "15 min",
          completed: false,
          order: 4,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "debugging-techniques",
          title: "Debugging Techniques & Tools",
          duration: "25 min",
          completed: false,
          order: 5,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "best-practices",
          title: "Error Handling Best Practices",
          duration: "15 min",
          completed: false,
          order: 6,
          hasQuiz: false,
          isLocked: true,
        },
      ],
      order: 7,
      isLocked: true,
    },
    {
      id: "file-operations",
      title: "File Operations & I/O",
      duration: "2.5 hours",
      completed: false,
      lectures: [
        {
          id: "file-opening-closing",
          title: "Opening & Closing Files",
          duration: "20 min",
          completed: false,
          order: 1,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "reading-files",
          title: "Reading from Files",
          duration: "25 min",
          completed: false,
          order: 2,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "writing-files",
          title: "Writing to Files",
          duration: "25 min",
          completed: false,
          order: 3,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "file-modes",
          title: "File Modes & Operations",
          duration: "20 min",
          completed: false,
          order: 4,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "with-statement",
          title: "Context Managers & With Statement",
          duration: "20 min",
          completed: false,
          order: 5,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "csv-json",
          title: "Working with CSV & JSON Files",
          duration: "35 min",
          completed: false,
          order: 6,
          hasQuiz: true,
          isLocked: true,
        },
        {
          id: "file-system",
          title: "File System Operations",
          duration: "25 min",
          completed: false,
          order: 7,
          hasQuiz: false,
          isLocked: true,
        },
      ],
      order: 8,
      isLocked: true,
    },
    {
      id: "final-project",
      title: "Final Project & Assessment",
      duration: "3 hours",
      completed: false,
      lectures: [
        {
          id: "project-overview",
          title: "Final Project Overview",
          duration: "15 min",
          completed: false,
          order: 1,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "project-planning",
          title: "Project Planning & Design",
          duration: "30 min",
          completed: false,
          order: 2,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "implementation-part1",
          title: "Implementation - Part 1",
          duration: "45 min",
          completed: false,
          order: 3,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "implementation-part2",
          title: "Implementation - Part 2",
          duration: "45 min",
          completed: false,
          order: 4,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "testing-debugging",
          title: "Testing & Debugging Your Project",
          duration: "30 min",
          completed: false,
          order: 5,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "code-review",
          title: "Code Review & Best Practices",
          duration: "20 min",
          completed: false,
          order: 6,
          hasQuiz: false,
          isLocked: true,
        },
        {
          id: "final-assessment",
          title: "Final Assessment Quiz",
          duration: "15 min",
          completed: false,
          order: 7,
          hasQuiz: true,
          isLocked: true,
        },
      ],
      order: 9,
      isLocked: true,
    },
  ];

  console.log("Mock sub-courses created:", mockSubCourses);
  return mockSubCourses;
};

// Improved mock lectures with proper progress tracking
const getMockLectures = (subCourseId: string, userId?: string): Lecture[] => {
  console.log(
    "Creating mock lectures for subCourse:",
    subCourseId,
    "userId:",
    userId
  );

  if (subCourseId === "intro-python") {
    return [
      {
        id: "what-is-python",
        title: "What is Python?",
        duration: "15 min",
        completed: false,
        order: 1,
        hasQuiz: true,
        isLocked: false,
      },
      {
        id: "python-installation",
        title: "Installing Python & IDE Setup",
        duration: "20 min",
        completed: false,
        order: 2,
        hasQuiz: false,
        isLocked: true,
      },
      {
        id: "python-syntax",
        title: "Python Syntax Basics",
        duration: "25 min",
        completed: false,
        order: 3,
        hasQuiz: true,
        isLocked: true,
      },
      {
        id: "comments-and-documentation",
        title: "Comments & Documentation",
        duration: "15 min",
        completed: false,
        order: 4,
        hasQuiz: false,
        isLocked: true,
      },
      {
        id: "python-interpreter",
        title: "Understanding Python Interpreter",
        duration: "20 min",
        completed: false,
        order: 5,
        hasQuiz: true,
        isLocked: true,
      },
    ];
  }

  if (subCourseId === "variables-data-types") {
    return [
      {
        id: "variables-basics",
        title: "Variables and Assignment",
        duration: "20 min",
        completed: false,
        order: 1,
        hasQuiz: true,
        isLocked: true,
      },
      {
        id: "numbers-integers-floats",
        title: "Numbers: Integers & Floats",
        duration: "25 min",
        completed: false,
        order: 2,
        hasQuiz: true,
        isLocked: true,
      },
      {
        id: "strings-manipulation",
        title: "Strings & String Manipulation",
        duration: "30 min",
        completed: false,
        order: 3,
        hasQuiz: true,
        isLocked: true,
      },
      {
        id: "booleans-none",
        title: "Booleans & None Type",
        duration: "15 min",
        completed: false,
        order: 4,
        hasQuiz: true,
        isLocked: true,
      },
      {
        id: "type-conversion",
        title: "Type Conversion & Casting",
        duration: "20 min",
        completed: false,
        order: 5,
        hasQuiz: true,
        isLocked: true,
      },
      {
        id: "input-output",
        title: "User Input & Output",
        duration: "25 min",
        completed: false,
        order: 6,
        hasQuiz: false,
        isLocked: true,
      },
    ];
  }

  // Return default lectures for other sub-courses
  return [
    {
      id: "default-lecture",
      title: "Default Lecture",
      duration: "20 min",
      completed: false,
      order: 1,
      hasQuiz: false,
      isLocked: true,
    },
  ];
};

// Update the total lectures count to reflect the new comprehensive content
const getTotalLecturesCount = async (courseId: string): Promise<number> => {
  // Calculate based on actual mock data structure
  const mockSubCourses = getMockSubCourses();
  let totalLectures = 0;

  mockSubCourses.forEach((subCourse) => {
    totalLectures += subCourse.lectures.length;
  });

  return totalLectures; // Should be around 54 lectures total
};

// Seed initial courses (for development)
export const seedCourses = async (): Promise<void> => {
  const initialCourses = [
    {
      id: "python-basics",
      title: "Python Fundamentals",
      description:
        "Master the building blocks of Python programming with hands-on exercises and real-world projects.",
      difficulty: "Beginner" as const,
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
      difficulty: "Intermediate" as const,
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
      difficulty: "Advanced" as const,
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
      difficulty: "Advanced" as const,
      duration: "12 weeks",
      lessons: 45,
      topics: ["NumPy", "Pandas", "ML Algorithms", "Deep Learning"],
      isPopular: true,
      createdAt: new Date(),
    },
  ];

  try {
    for (const course of initialCourses) {
      const courseRef = doc(firestore, "courses", course.id);
      await setDoc(courseRef, course);
    }
    console.log("Courses seeded successfully");
  } catch (error) {
    console.error("Error seeding courses:", error);
  }
};

// (Removed duplicate getMockLectures function declaration to fix redeclaration error)

// Get lectures for a sub-course with progress tracking - improved version
export const getLectures = async (
  courseId: string,
  subCourseId: string,
  userId?: string
): Promise<Lecture[]> => {
  try {
    const lecturesRef = collection(
      firestore,
      "courses",
      courseId,
      "subCourses",
      subCourseId,
      "lectures"
    );
    const q = query(lecturesRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    // If no data found in Firestore, get mock data and apply user progress
    if (querySnapshot.size === 0) {
      console.log(
        "No lectures found in Firestore, getting mock data with progress"
      );
      const mockLectures = getMockLectures(subCourseId, userId);

      // Apply user progress to mock lectures
      if (userId) {
        const progressRef = doc(
          firestore,
          "userProgress",
          `${userId}_${courseId}`
        );
        const progressSnap = await getDoc(progressRef);
        if (progressSnap.exists()) {
          const userProgress = progressSnap.data();
          console.log("Applying user progress to mock lectures:", userProgress);

          // Update completion status based on user progress
          mockLectures.forEach((lecture) => {
            lecture.completed =
              userProgress.completedLectures?.includes(lecture.id) || false;
          });

          // Update lock status based on completion
          for (let i = 0; i < mockLectures.length; i++) {
            if (i === 0) {
              mockLectures[i].isLocked = false; // First lecture is always unlocked
            } else {
              // Lock if previous lecture is not completed
              mockLectures[i].isLocked = !mockLectures[i - 1].completed;
            }
          }

          console.log(
            "Mock lectures with applied progress:",
            mockLectures.map((l) => ({
              id: l.id,
              completed: l.completed,
              isLocked: l.isLocked,
            }))
          );
        }
      }

      return mockLectures;
    }

    const lectures: Lecture[] = [];
    let userProgress: any = {};

    // Get user progress if userId is provided
    if (userId) {
      const progressRef = doc(
        firestore,
        "userProgress",
        `${userId}_${courseId}`
      );
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        userProgress = progressSnap.data();
        console.log("User progress for lectures:", userProgress);
      }
    }

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const isCompleted =
        userProgress.completedLectures?.includes(doc.id) || false;

      lectures.push({
        id: doc.id,
        title: data.title,
        duration: data.duration,
        completed: isCompleted,
        content: data.content,
        videoUrl: data.videoUrl,
        order: data.order || 0,
        hasQuiz: data.hasQuiz || false,
        isLocked: false, // Will be determined later
      });
    }

    // Determine locked status based on previous completion
    for (let i = 0; i < lectures.length; i++) {
      if (i === 0) {
        lectures[i].isLocked = false; // First lecture is always unlocked
      } else {
        // Lock if previous lecture is not completed
        lectures[i].isLocked = !lectures[i - 1].completed;
      }
    }

    console.log(
      "Lectures with lock status:",
      lectures.map((l) => ({
        id: l.id,
        completed: l.completed,
        isLocked: l.isLocked,
      }))
    );

    return lectures;
  } catch (error) {
    console.error("Error fetching lectures:", error);

    // Return mock data as fallback with proper progress
    return getMockLectures(subCourseId, userId);
  }
};

// Get sub-courses for a course with progress tracking
export const getSubCourses = async (
  courseId: string,
  userId?: string
): Promise<SubCourse[]> => {
  console.log(
    "getSubCourses called with courseId:",
    courseId,
    "userId:",
    userId
  );

  try {
    // Always return mock data for now to ensure something is shown
    console.log("Using mock data for sub-courses");
    const mockSubCourses = getMockSubCourses(userId);

    // Apply user progress to mock sub-courses if userId is provided
    if (userId) {
      try {
        const progressRef = doc(
          firestore,
          "userProgress",
          `${userId}_${courseId}`
        );
        const progressSnap = await getDoc(progressRef);
        if (progressSnap.exists()) {
          const userProgress = progressSnap.data();
          console.log(
            "Applying user progress to mock sub-courses:",
            userProgress
          );

          // Update each sub-course with real progress
          for (const subCourse of mockSubCourses) {
            // Update lectures with progress
            subCourse.lectures.forEach((lecture) => {
              lecture.completed =
                userProgress.completedLectures?.includes(lecture.id) || false;
            });

            // Update lock status for lectures based on sequential completion
            for (let i = 0; i < subCourse.lectures.length; i++) {
              if (i === 0) {
                subCourse.lectures[i].isLocked = false; // First lecture always unlocked
              } else {
                // Unlock if previous lecture is completed
                subCourse.lectures[i].isLocked =
                  !subCourse.lectures[i - 1].completed;
              }
            }

            // Update sub-course completion status
            subCourse.completed = subCourse.lectures.every(
              (lecture) => lecture.completed
            );
          }

          // Update sub-course lock status based on completion
          for (let i = 0; i < mockSubCourses.length; i++) {
            if (i === 0) {
              mockSubCourses[i].isLocked = false; // First sub-course always unlocked
            } else {
              // Unlock if previous sub-course is completed
              mockSubCourses[i].isLocked = !mockSubCourses[i - 1].completed;
            }
          }

          console.log(
            "Applied progress to mock sub-courses:",
            mockSubCourses.map((sc) => ({
              id: sc.id,
              completed: sc.completed,
              isLocked: sc.isLocked,
              lectures: sc.lectures.map((l) => ({
                id: l.id,
                title: l.title,
                completed: l.completed,
                isLocked: l.isLocked,
              })),
            }))
          );
        }
      } catch (progressError) {
        console.error("Error applying progress to mock data:", progressError);
      }
    }

    return mockSubCourses;
  } catch (error) {
    console.error("Error in getSubCourses:", error);

    // Return basic mock data as final fallback
    return getMockSubCourses(userId);
  }
};

// Get quiz for a lecture
export const getLectureQuiz = async (
  courseId: string,
  subCourseId: string,
  lectureId: string
): Promise<Quiz | null> => {
  try {
    const quizRef = doc(
      firestore,
      "courses",
      courseId,
      "subCourses",
      subCourseId,
      "lectures",
      lectureId,
      "quiz",
      "main"
    );
    const quizSnap = await getDoc(quizRef);

    if (quizSnap.exists()) {
      const data = quizSnap.data();
      return {
        id: quizSnap.id,
        questions: data.questions || [],
        passingScore: data.passingScore || 80,
        maxAttempts: data.maxAttempts || 3,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching quiz:", error);

    // Return mock quiz as fallback
    return getMockQuiz(lectureId);
  }
};

// Mock quiz generator for fallback
const getMockQuiz = (lectureId: string): Quiz => {
  return {
    id: lectureId,
    questions: [
      {
        question: "Who created Python?",
        options: [
          "Guido van Rossum",
          "Dennis Ritchie",
          "James Gosling",
          "Bjarne Stroustrup",
        ],
        correctAnswer: 0,
      },
      {
        question: "In what year was Python first released?",
        options: ["1989", "1991", "1995", "2000"],
        correctAnswer: 1,
      },
    ],
    passingScore: 80,
    maxAttempts: 3,
  };
};

// Submit quiz attempt
export const submitQuizAttempt = async (
  userId: string,
  courseId: string,
  subCourseId: string,
  lectureId: string,
  answers: number[],
  quiz: Quiz
): Promise<{
  passed: boolean;
  score: number;
  attempts: number;
  canRetry: boolean;
}> => {
  try {
    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    // Get current attempts
    const attemptsRef = doc(
      firestore,
      "quizAttempts",
      `${userId}_${lectureId}`
    );
    const attemptsSnap = await getDoc(attemptsRef);

    let attempts = 1;
    if (attemptsSnap.exists()) {
      attempts = (attemptsSnap.data().attempts || 0) + 1;
    }

    // Save attempt
    await setDoc(attemptsRef, {
      userId,
      courseId,
      subCourseId,
      lectureId,
      attempts,
      lastScore: score,
      passed,
      lastAttemptAt: new Date(),
    });

    // If passed, mark lecture as completed
    if (passed) {
      await updateLectureProgress(
        userId,
        courseId,
        subCourseId,
        lectureId,
        true
      );
    }

    const canRetry = attempts < quiz.maxAttempts && !passed;

    return {
      passed,
      score,
      attempts,
      canRetry,
    };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return { passed: false, score: 0, attempts: 0, canRetry: false };
  }
};

// Get user's quiz attempts for a lecture
export const getUserQuizAttempts = async (
  userId: string,
  lectureId: string
): Promise<{ attempts: number; passed: boolean; lastScore: number } | null> => {
  try {
    const attemptsRef = doc(
      firestore,
      "quizAttempts",
      `${userId}_${lectureId}`
    );
    const attemptsSnap = await getDoc(attemptsRef);

    if (attemptsSnap.exists()) {
      const data = attemptsSnap.data();
      return {
        attempts: data.attempts || 0,
        passed: data.passed || false,
        lastScore: data.lastScore || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting quiz attempts:", error);
    return null;
  }
};

// (Duplicate getMockSubCourses function removed to fix redeclaration error)

// Seed course structure with sub-courses, lectures, and quizzes
export const seedCourseStructure = async (): Promise<void> => {
  try {
    const courseId = "python-basics";

    // Sub-courses
    const subCourses = [
      {
        id: "intro-python",
        title: "Introduction to Python",
        duration: "45 min",
        order: 1,
      },
      {
        id: "first-program",
        title: "Your First Python Program",
        duration: "30 min",
        order: 2,
      },
    ];

    for (const subCourse of subCourses) {
      await setDoc(
        doc(firestore, "courses", courseId, "subCourses", subCourse.id),
        subCourse
      );

      // Add lectures for each sub-course
      if (subCourse.id === "intro-python") {
        const lectures = [
          {
            id: "what-is-python",
            title: "What is Python?",
            duration: "8 min",
            order: 1,
            hasQuiz: true,
            content: "Python is a high-level programming language...",
          },
          {
            id: "python-uses",
            title: "Where is Python used?",
            duration: "12 min",
            order: 2,
            hasQuiz: true,
            content: "Python is used in web development, data science...",
          },
        ];

        for (const lecture of lectures) {
          await setDoc(
            doc(
              firestore,
              "courses",
              courseId,
              "subCourses",
              subCourse.id,
              "lectures",
              lecture.id
            ),
            lecture
          );

          // Add quiz for lectures that have one
          if (lecture.hasQuiz) {
            const quiz = {
              questions: [
                {
                  question: "Who created Python?",
                  options: [
                    "Guido van Rossum",
                    "Dennis Ritchie",
                    "James Gosling",
                    "Bjarne Stroustrup",
                  ],
                  correctAnswer: 0,
                },
                {
                  question: "In what year was Python first released?",
                  options: ["1989", "1991", "1995", "2000"],
                  correctAnswer: 1,
                },
              ],
              passingScore: 80,
              maxAttempts: 3,
            };

            await setDoc(
              doc(
                firestore,
                "courses",
                courseId,
                "subCourses",
                subCourse.id,
                "lectures",
                lecture.id,
                "quiz",
                "main"
              ),
              quiz
            );
          }
        }
      }
    }

    console.log("Course structure seeded successfully");
  } catch (error) {
    console.error("Error seeding course structure:", error);
  }
};
