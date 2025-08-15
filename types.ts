import { Timestamp } from "firebase/firestore";
import { Icon } from "phosphor-react-native";
import React, { ReactNode } from "react";
import {
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type CustomAlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  type?: "error" | "success" | "warning";
};

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};
export type ModalWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: string;
};
export type accountOptionType = {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  routeName?: any;
};

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: any | null;
  style?: TextStyle;
  textProps?: TextProps;
};

export type IconComponent = React.ComponentType<{
  height?: number;
  width?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}>;

export type IconProps = {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type BackButtonProps = {
  style?: ViewStyle;
  iconSize?: number;
};

export type TransactionType = {
  id?: string;
  type: string;
  amount: number;
  category?: string;
  date: Date | Timestamp | string;
  description?: string;
  image?: any;
  uid?: string;
  walletId: string;
};

export type CategoryType = {
  label: string;
  value: string;
  icon: Icon;
  bgColor: string;
};
export type ExpenseCategoriesType = {
  [key: string]: CategoryType;
};

export type TransactionListType = {
  data: TransactionType[];
  title?: string;
  loading?: boolean;
  emptyListMessage?: string;
};

export type TransactionItemProps = {
  item: TransactionType;
  index: number;
  handleClick: Function;
};

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
  //   label?: string;
  //   error?: string;
}

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};

export type UserType = {
  uid?: string;
  email?: string | null;
  name: string | null;
  image?: any;
} | null;

export type UserDataType = {
  name: string;
  image?: any;
  preferences?: string[];
};

export type AuthContextType = {
  user: UserType;
  setUser: Function;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  markOnboardingComplete: () => Promise<void>;
};

export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  image?: string;
  topics: string[];
  createdAt?: Date;
  isPopular?: boolean;
};

export type Lecture = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  content?: string;
  videoUrl?: string;
  order: number;
  hasQuiz: boolean;
  isLocked: boolean;
};

export type SubCourse = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  lectures: Lecture[];
  order: number;
  isLocked: boolean;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
};

export type Quiz = {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts: number;
};

export type QuizAttempt = {
  userId: string;
  courseId: string;
  subCourseId: string;
  lectureId: string;
  attempts: number;
  lastScore: number;
  passed: boolean;
  lastAttemptAt: Date;
};

export type UserProgress = {
  userId: string;
  courseId: string;
  subCourseId?: string;
  lectureId?: string;
  progress: number;
  completedLectures: string[];
  completedSubCourses: string[];
  lastAccessedAt: Date;
};

export type UserEnrollment = {
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number;
  currentLesson: number;
  completed: boolean;
};
