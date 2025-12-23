// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCMhSp42tK3DrDEKSuVVb0tEYmbmUIjtKE",
    authDomain: "jianshanscholar.firebaseapp.com",
    projectId: "jianshanscholar",
    storageBucket: "jianshanscholar.firebasestorage.app",
    messagingSenderId: "272891928018",
    appId: "1:272891928018:web:888aa9a99c61603bb93c0b",
    measurementId: "G-0MBY9H363B"
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);