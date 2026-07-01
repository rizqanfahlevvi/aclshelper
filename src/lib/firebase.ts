import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ9_n27m0jZ4546pKqiFR6PzFIa2huk",
  authDomain: "md-kit-sso.firebaseapp.com",
  projectId: "md-kit-sso",
  storageBucket: "md-kit-sso.firebasestorage.app",
  messagingSenderId: "612775808268",
  appId: "1:612775808268:web:0a9e71ec281d98ba212a69"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
