import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQYvzQkRMZ0PI_S1Icjb7TAI35WdF2I4o",
  authDomain: "expense-tracker-bb740.firebaseapp.com",
  projectId: "expense-tracker-bb740",
  storageBucket: "expense-tracker-bb740.firebasestorage.app",
  messagingSenderId: "535920450334",
  appId: "1:535920450334:web:12d56a5e211b74d781c70f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

//db
// Think of Firestore as Google’s cloud database for your app — a place to store and sync data for your users, in real time, without you having to manage servers.
export const firestore = getFirestore(app);

export default app;
