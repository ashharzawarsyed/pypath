import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // This function will check auth and onboarding status, then navigate
    const initializeApp = async () => {
      try {
        // First check if onboarding is completed
        const onboardingCompleted = await AsyncStorage.getItem(
          "onboardingCompleted"
        );
        const hasCompleted = onboardingCompleted === "true";
        setHasCompletedOnboarding(hasCompleted);
        console.log("Onboarding completed:", hasCompleted);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("Firebase user:", firebaseUser);

          setTimeout(() => {
            if (firebaseUser) {
              setUser({
                uid: firebaseUser?.uid,
                email: firebaseUser?.email,
                name: firebaseUser?.displayName,
              });
              updateUserData(firebaseUser.uid);
              router.replace("/(tabs)");
            } else {
              setUser(null);
              if (hasCompleted) {
                router.replace("/(auth)/welcome");
              } else {
                console.log("Redirecting to onboarding...");
                router.replace("/(onboarding)/onboarding");
              }
            }
            setLoading(false);
          }, 2000);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Initialization error:", error);
        setLoading(false);
        return () => {};
      }
    };

    // Start the initialization process
    let unsubscribe: (() => void) | undefined;
    initializeApp().then((unsub) => {
      if (typeof unsub === "function") {
        unsubscribe = unsub;
      }
    });
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [router]);

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem("onboardingCompleted", "true");
      setHasCompletedOnboarding(true);
      console.log("Onboarding marked as complete");
    } catch (error) {
      console.log("Error saving onboarding status:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)"))
        msg = "Invalid credentials. Please try again.";
      if (msg.includes("(auth/invalid-email)"))
        msg = "Invalid credentials. Please try again.";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get selected options from AsyncStorage first
      const selectedOptionsString = await AsyncStorage.getItem(
        "selectedOptions"
      );
      let preferences: string[] = [];

      if (selectedOptionsString) {
        preferences = JSON.parse(selectedOptionsString);
        console.log("Found preferences during registration:", preferences);
      }

      // Create user document with preferences included
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        name,
        email,
        uid: response?.user?.uid,
        preferences: preferences.length > 0 ? preferences : [],
        createdAt: new Date(),
      });

      console.log("User document created with preferences:", preferences);

      // Clear preferences from AsyncStorage after successful sync
      if (preferences.length > 0) {
        await AsyncStorage.removeItem("selectedOptions");
        console.log("Cleared selectedOptions from AsyncStorage");
      }

      // Mark onboarding complete ONLY after successful registration
      await markOnboardingComplete();
      console.log("Onboarding marked complete after successful registration");

      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/email-already-in-use)"))
        msg = "Email already in use. Please try again.";
      if (msg.includes("(auth/invalid-email)"))
        msg = "Invalid credentials. Please try again.";
      return { success: false, msg };
    }
  };

  const syncPreferencesToFirestore = async (userId: string) => {
    try {
      console.log("Syncing preferences for user:", userId);

      // Check if user already has preferences in Firestore
      const docRef = doc(firestore, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log("Current user data:", userData);

        // If preferences already exist and are not empty, don't overwrite them
        if (userData.preferences && userData.preferences.length > 0) {
          console.log(
            "User preferences already exist in Firestore:",
            userData.preferences
          );
          return;
        }
      }

      // Get selected options from AsyncStorage
      const selectedOptionsString = await AsyncStorage.getItem(
        "selectedOptions"
      );
      console.log("Selected options from AsyncStorage:", selectedOptionsString);

      if (selectedOptionsString) {
        const selectedOptions: string[] = JSON.parse(selectedOptionsString);
        console.log("Parsed selected options:", selectedOptions);

        if (selectedOptions.length > 0) {
          // Update user document with preferences
          await updateDoc(docRef, {
            preferences: selectedOptions,
            preferencesUpdatedAt: new Date(),
          });

          console.log("Preferences synced to Firestore:", selectedOptions);

          // Clear from AsyncStorage after successful sync
          await AsyncStorage.removeItem("selectedOptions");
          console.log("Cleared selectedOptions from AsyncStorage after sync");
        }
      } else {
        console.log("No selected options found in AsyncStorage");
      }
    } catch (error) {
      console.error("Error syncing preferences to Firestore:", error);
    }
  };

  const updateUserData = async (userId: string) => {
    try {
      const docRef = doc(firestore, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          uid: userId,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
        };
        setUser({ ...userData });

        console.log("User data loaded, preferences:", data.preferences);

        // For existing users logging in, if they have preferences in Firestore,
        // consider onboarding complete
        if (data.preferences && data.preferences.length > 0) {
          const onboardingCompleted = await AsyncStorage.getItem(
            "onboardingCompleted"
          );
          if (onboardingCompleted !== "true") {
            await markOnboardingComplete();
            console.log(
              "Marked onboarding complete for existing user with preferences"
            );
          }
        }

        // Sync preferences if this is a first-time login and preferences exist in AsyncStorage
        // but user doesn't have preferences in Firestore yet
        if (!data.preferences || data.preferences.length === 0) {
          const selectedOptionsString = await AsyncStorage.getItem(
            "selectedOptions"
          );
          if (selectedOptionsString) {
            console.log(
              "Found preferences in AsyncStorage for existing user, syncing..."
            );
            await syncPreferencesToFirestore(userId);
          }
        }
      }
    } catch (error: any) {
      console.log("Error updating user data:", error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
    loading,
    hasCompletedOnboarding,
    markOnboardingComplete,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/*
import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("firebaseUser:", firebaseUser);
      if (firebaseUser) {
        setUser({
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
          name: firebaseUser?.displayName,
        });
        updateUserData(firebaseUser.uid);
        router.replace("/(tabs)");
      } else {
        setUser(null);
        router.replace("/(auth)/welcome");
      }
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)"))
        msg = "Invalid credentials. Please try again.";
      if (msg.includes("(auth/invalid-email)"))
        msg = "Invalid credentials. Please try again.";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        name,
        email,
        uid: response?.user?.uid,
      });
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/email-already-in-use)"))
        msg = "Email already in use. Please try again.";
      if (msg.includes("(auth/invalid-email)"))
        msg = "Invalid credentials. Please try again.";
      return { success: false, msg };
    }
  };

  const updateUserData = async (userId: string) => {
    try {
      const docRef = doc(firestore, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          uid: userId,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
        };
        setUser({ ...userData });
      }
    } catch (error: any) {
      console.log("Error updating user data:", error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
*/
