"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { isAdmin } from '@/lib/utils'; // Keep existing utility

// Export User type from Firebase
export type { User };

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, password?: string) => Promise<void>;
    register: (email: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Derived state for admin check. 
    // Note: In real app, this should be a claim or db lookup, but for now purely email based.
    const isUserAdmin = user && user.email && isAdmin(user.email);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Logged in
                setUser(user);
            } else {
                // Not logged in
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (emailOrUsername: string, password?: string) => {
        if (!password) {
            throw new Error("Password is required for login");
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, emailOrUsername, password);
        } catch (error) {
            console.error("Firebase login failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, name?: string) => {
        // 目前不实现注册功能
        console.warn("Registration is currently disabled.");
        throw new Error("Registration disabled");
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin: !!isUserAdmin, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
