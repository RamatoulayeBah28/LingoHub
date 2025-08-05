// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUnLRkKe2I8IndHU3FHH24EpXGS8xiRS0",
  authDomain: "lingohub-web102.firebaseapp.com",
  projectId: "lingohub-web102",
  storageBucket: "lingohub-web102.firebasestorage.app",
  messagingSenderId: "1036752417561",
  appId: "1:1036752417561:web:67b14af1753059dcb6cb88",
  measurementId: "G-CHTN3WJRT2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
