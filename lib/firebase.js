import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBfIY01PH7AfFKJYeeimcvNjOXWCxbixMA",
  authDomain: "oblako51-37f42.firebaseapp.com",
  projectId: "oblako51-37f42",
  storageBucket: "oblako51-37f42.firebasestorage.app",
  messagingSenderId: "122973627448",
  appId: "1:122973627448:web:ce801fb4413703eaf932cd",
  measurementId: "G-YF47T6JFLQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const registerUser = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};