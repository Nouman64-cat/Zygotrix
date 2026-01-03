import React from 'react';
import { BiLoaderAlt } from 'react-icons/bi';
import { MdCheckCircle, MdError } from 'react-icons/md';
import { Button } from '../common';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { useAuth } from '../../contexts';
import type { ChatPreferences } from '../../types';

interface GeneralSectionProps {
    loading: boolean;
    preferences: ChatPreferences | null;
    success: string | null;
    error: string | null;
    onRefresh: () => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
    loading,
    preferences,
    success,
    error,
    onRefresh,
}) => {
    const { user } = useAuth();

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.full_name) return 'U';
        const names = user.full_name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return names[0][0].toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <BiLoaderAlt className="w-6 h-6 text-emerald-600 animate-spin" />
                <p className="text-sm text-gray-500">Loading preferences...</p>
            </div>
        );
    }

    // Note: General settings (Profile/Appearance) don't strictly require preferences to be loaded,
    // but we keep the error state consistent with other sections.
    if (!preferences) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500 text-sm">Failed to load preferences</p>
                <Button
                    variant="secondary"
                    onClick={onRefresh}
                    className="mt-4"
                    size="sm"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Notifications */}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
                    <MdCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                    <MdError className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Profile Section */}
            <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>

                <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Full name</label>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                                {getUserInitials()}
                            </div>
                            <div className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                                {user?.full_name || 'User'}
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Email</label>
                        <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                            {user?.email || '—'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Appearance Section */}
            <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose your preferred color scheme
                </p>
                <ThemeSwitcher variant="cards" />
            </section>
        </div>
    );
};
