"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type User,
  type SignUpData,
  getCurrentUser,
  signIn as signInApi,
  signUp as signUpApi,
  signOut as signOutApi,
} from "@/lib/auth";
import { dataSyncService } from "@/lib/data-sync-service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSyncing: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (data: SignUpData) => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);

    if (currentUser) {
      setIsSyncing(true);
      dataSyncService.syncAllData().finally(() => setIsSyncing(false));

      // Live updates sync
      dataSyncService.startContinuousSync("jobs", currentUser.id);
      dataSyncService.startContinuousSync("notifications", currentUser.id);
      dataSyncService.startContinuousSync("employees", currentUser.id);
      dataSyncService.startContinuousSync("chat", currentUser.id);
    }

    return () => {
      dataSyncService.stopAllContinuousSync();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const loggedInUser = await signInApi(email, password);
    setUser(loggedInUser);
    setIsLoading(false);
    return loggedInUser;
  };

  const signUp = async (data: SignUpData) => {
    setIsLoading(true);
    const newUser = await signUpApi(data);
    setUser(newUser);
    setIsLoading(false);
    return newUser;
  };

  const signOut = async () => {
    dataSyncService.stopAllContinuousSync();
    dataSyncService.clearAllSyncData();
    await signOutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isSyncing, setUser, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
