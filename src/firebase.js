import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCJmdaO2a_qP475Tr3AivpsEtK0VgKZx-c",
  authDomain: "movie-matcher-54cf2.firebaseapp.com",
  projectId: "movie-matcher-54cf2",
  storageBucket: "movie-matcher-54cf2.firebasestorage.app",
  messagingSenderId: "11431212223",
  appId: "1:11431212223:web:d40e71ef5cb95b90fa420a",
  measurementId: "G-P6B0H7BR6M"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;