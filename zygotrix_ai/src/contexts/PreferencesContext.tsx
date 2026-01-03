import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth/auth.service';
import type { ChatPreferences, UserPreferencesUpdate } from '../types';
import { useAuth } from './AuthContext';

interface PreferencesContextType {
    preferences: ChatPreferences | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    refreshPreferences: () => Promise<void>;
    updatePreferences: (updates: UserPreferencesUpdate) => Promise<void>;
    resetPreferences: () => Promise<void>;
    // Optimistic update helper
    optimisticUpdate: (updates: Partial<ChatPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch when user is available
    useEffect(() => {
        if (user) {
            refreshPreferences();
        } else {
            setPreferences(null);
        }
    }, [user]);

    const refreshPreferences = useCallback(async () => {
        if (!user) return; // Don't fetch if not logged in

        setLoading(true);
        setError(null);
        try {
            // Use authService which has caching implemented (P0 Item 1.1)
            const data = await authService.getUserPreferences();
            setPreferences(data);
        } catch (err) {
            console.error('Failed to load preferences:', err);
            setError('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updatePreferences = useCallback(async (updates: UserPreferencesUpdate) => {
        setSaving(true);
        setError(null);

        // Optimistic update handled by caller or we can do it here if we pass the full new state object
        // For now, we expect the caller to might want to do optimistic UI updates, 
        // but the official state update happens after API or here if we want to enforce it.

        try {
            const updated = await authService.updateUserPreferences(updates);
            setPreferences(updated);
        } catch (err) {
            console.error('Failed to update preferences:', err);
            setError('Failed to save preferences');
            // Re-fetch to sync state in case of failure/rollback needs
            refreshPreferences();
            throw err; // Re-throw to let components handle specific UI feedback
        } finally {
            setSaving(false);
        }
    }, [refreshPreferences]);

    const resetPreferences = useCallback(async () => {
        setSaving(true);
        setError(null);
        try {
            const defaults = await authService.resetUserPreferences();
            setPreferences(defaults);
        } catch (err) {
            console.error('Failed to reset preferences:', err);
            setError('Failed to reset preferences');
            throw err;
        } finally {
            setSaving(false);
        }
    }, []);

    const optimisticUpdate = useCallback((updates: Partial<ChatPreferences>) => {
        if (preferences) {
            setPreferences({ ...preferences, ...updates });
        }
    }, [preferences]);

    return (
        <PreferencesContext.Provider
            value={{
                preferences,
                loading,
                saving,
                error,
                refreshPreferences,
                updatePreferences,
                resetPreferences,
                optimisticUpdate
            }}
        >
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
};
