"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { auth } from '@/lib/cloudbase';
import { isAdmin } from '@/lib/utils';

// Define a simplified User type based on CloudBase user or just use any
// Cloudbase user typically has uid, email, etc.
export type User = any;

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
    // CloudBase user object usually has 'email' or 'username'.
    const isUserAdmin = user && (isAdmin(user.email) || isAdmin(user.username));

    useEffect(() => {
        // 监听登录状态变化
        if (!auth) {
            setLoading(false);
            return;
        }

        // @ts-ignore - cloudbase types might be missing or incomplete in this context
        const authStateListener = (auth as any).onLoginStateChanged((loginState: any) => {
            if (loginState) {
                // 已登录
                // console.log("Login state changed: ", loginState.user);
                setUser(loginState.user);
            } else {
                // 未登录
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            // 清理监听器 (if supported by SDK, otherwise just ignore)
        };
    }, []);

    const login = async (emailOrUsername: string, password?: string) => {
        if (!password) {
            throw new Error("Password is required for CloudBase login");
        }

        // Ensure auth is initialized (client-side)
        if (!auth) {
            console.warn("Auth not initialized");
            return;
        }

        setLoading(true);
        try {
            // 使用 CloudBase 统一登录接口
            await (auth as any).signIn({
                username: emailOrUsername,
                password: password
            });
            // 登录成功后 onLoginStateChanged 会触发
        } catch (error) {
            console.error("CloudBase login failed:", error);
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
            if (auth) {
                await (auth as any).signOut();
            }
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
