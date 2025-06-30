import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDmssJGWV0Ly4NLdmY7xaeEIwcSMgMpzM4",
    authDomain: "just-test-a26cb.firebaseapp.com",
    projectId: "just-test-a26cb",
    storageBucket: "just-test-a26cb.firebasestorage.app",
    messagingSenderId: "430491379636",
    appId: "1:430491379636:web:258eb4b330de9addf0f4e1"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);