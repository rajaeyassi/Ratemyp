// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import the authentication module
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNGQb2QxfiW282eEwLb05jJx3DgK4AvuI",
  authDomain: "ratemyprof-c955d.firebaseapp.com",
  projectId: "ratemyprof-c955d",
  storageBucket: "ratemyprof-c955d.appspot.com",
  messagingSenderId: "550785341466",
  appId: "1:550785341466:web:bce001f67c26613a4c99a3",
  measurementId: "G-FJ9JQNTPML"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Initialize and export auth

export { auth, analytics };
