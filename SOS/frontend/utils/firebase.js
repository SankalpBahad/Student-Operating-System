// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAamXGiBErlpZHDMaA_fWmWTkwAD-7o4AE",
  authDomain: "seproject3-3a763.firebaseapp.com",
  projectId: "seproject3-3a763",
  storageBucket: "seproject3-3a763.firebasestorage.app",
  messagingSenderId: "348277098981",
  appId: "1:348277098981:web:5b20969869c6007c53070c",
  measurementId: "G-6EMPZ217BG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };