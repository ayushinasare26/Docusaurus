'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession, signOut, AuthUser } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/amplify-config';

configureAmplify();

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    refreshUser: () => Promise<void>;
    handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<{
        user: AuthUser | null;
        loading: boolean;
        isAdmin: boolean;
        isSuperAdmin: boolean;
    }>({
        user: null,
        loading: true,
        isAdmin: false,
        isSuperAdmin: false,
    });

    const refreshUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) {
                if (res.status === 401 && window.location.pathname !== '/signin') {
                    window.location.href = '/signin';
                    return;
                }
                throw new Error('Not authenticated');
            }

            const data = await res.json();

            setAuthState({
                user: data.user,
                loading: false,
                isAdmin: data.authenticated,
                isSuperAdmin: data.isSuperAdmin,
            });
        } catch (error) {
            setAuthState({
                user: null,
                loading: false,
                isAdmin: false,
                isSuperAdmin: false,
            });

            if (window.location.pathname !== '/signin') {
                window.location.href = '/signin';
            }
        }
    };

    useEffect(() => {
        refreshUser();

        // Intercept global fetch to handle 401 Unauthorized errors automatically
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (response.status === 401) {
                    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url || '';
                    // Exclude auth-related endpoints to prevent infinite redirect/logout loops
                    const isAuthRoute = 
                        url.includes('/api/auth/me') || 
                        url.includes('/api/auth/login') || 
                        url.includes('/api/auth/confirm-login') ||
                        url.includes('/api/auth/logout');

                    if (!isAuthRoute) {
                        console.warn("Session expired or unauthorized (401). Redirecting to login...");
                        
                        // Set loading/logged out state locally
                        setAuthState({
                            user: null,
                            loading: false,
                            isAdmin: false,
                            isSuperAdmin: false,
                        });
                        
                        // Clear cookies in background and redirect
                        originalFetch('/api/auth/logout', { method: 'POST' }).finally(() => {
                            window.location.href = '/signin';
                        });
                    }
                }
                return response;
            } catch (error) {
                return Promise.reject(error);
            }
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    const handleSignOut = async () => {
        const results = await Promise.allSettled([
            signOut(),
            fetch('/api/auth/logout', { method: 'POST' })
        ]);

        const [amplifyResult, apiResult] = results;
        if (amplifyResult.status === 'rejected') {
            console.warn('Amplify signOut failed:', amplifyResult.reason);
        }

        if (apiResult.status === 'rejected') {
            console.warn('API logout failed:', apiResult.reason);
        }

        setAuthState({
            user: null,
            loading: false,
            isAdmin: false,
            isSuperAdmin: false,
        });

        window.location.href = '/signin';
    };

    return (
        <AuthContext.Provider value={{
            user: authState.user,
            loading: authState.loading,
            isAdmin: authState.isAdmin,
            isSuperAdmin: authState.isSuperAdmin,
            refreshUser,
            handleSignOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
