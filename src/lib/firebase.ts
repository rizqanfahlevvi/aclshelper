import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJi9_n27mOjZ4545pKqifR6PzFIa2zhuk",
  authDomain: "md-kit-sso.firebaseapp.com",
  projectId: "md-kit-sso",
  storageBucket: "md-kit-sso.firebasestorage.app",
  messagingSenderId: "612775000268",
  appId: "1:612775000268:web:0a9e71ec281d90ba212a69",
  measurementId: "G-CCQPJJYD53"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
