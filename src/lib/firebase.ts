import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCOr0X5goMGi-V8J-ojai2UpBDdY6G04y8",
  authDomain: "namoj-551b3.firebaseapp.com",
  projectId: "namoj-551b3",
  storageBucket: "namoj-551b3.firebasestorage.app",
  messagingSenderId: "84820523288",
  appId: "1:84820523288:web:3f8d0a820affc0f694c66d",
  measurementId: "G-JF51X4Z5QS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// No domain restriction — using standard Firebase Google login
// Samsung SSO integration will be added once Samsung provides API credentials
