import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  namaLengkap?: string;
  role: "pending" | "doctor" | "resident" | "specialist" | "admin";
  subscriptionStatus: "inactive" | "trial" | "active" | "expired";
  profileCompleted: boolean;
  subscriptionExpiredAt?: Timestamp | null;
  verificationStatus?: string;
  isAdmin?: boolean;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeFirestore = onSnapshot(userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
            setIsLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setIsLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const { doc: firestoreDoc, getDoc } = await import("firebase/firestore");
    const docSnap = await getDoc(firestoreDoc(db, "users", user.uid));
    if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfile);
  };

  const isAuthenticated = !!user;
  const isAuthorized =
    isAuthenticated &&
    userProfile !== null &&
    (!userProfile.subscriptionExpiredAt ||
      userProfile.subscriptionExpiredAt.toDate() > new Date());

  return (
    <AuthContext.Provider value={{
      user, userProfile, isLoading, isAuthenticated, isAuthorized, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
