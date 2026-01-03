import React, { memo } from 'react';
import { MdCheckCircle, MdError, MdRefresh } from 'react-icons/md';
import { BiLoaderAlt } from 'react-icons/bi';
import { Button } from '../common';
import { cn } from '../../utils';
import type { ChatPreferences } from '../../types';

// P1 Optimization (2.4): Memoized preference button
const PreferenceButton = memo(({
    option,
    value,
    isSelected,
    onClick
}: {
    option: { value: string; label: string };
    value: string;
    isSelected: boolean;
    onClick: (value: string) => void
}) => (
    <button
        onClick={() => onClick(value)}
        className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer',
            isSelected
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
    >
        {option.label}
    </button>
));

PreferenceButton.displayName = 'PreferenceButton';

interface LearningSectionProps {
    loading: boolean;
    preferences: ChatPreferences | null;
    saving: boolean;
    success: string | null;
    error: string | null;
    onRefresh: () => void;
    onSave: () => void;
    onReset: () => void;
    onPreferenceChange: (field: keyof ChatPreferences, value: string | boolean) => void;
    onArrayToggle: (field: 'teaching_aids' | 'visual_aids', value: string) => void;
}

export const LearningSection: React.FC<LearningSectionProps> = ({
    loading,
    preferences,
    saving,
    success,
    error,
    onRefresh,
    onSave,
    onReset,
    onPreferenceChange,
    onArrayToggle
}) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <BiLoaderAlt className="w-6 h-6 text-emerald-600 animate-spin" />
                <p className="text-sm text-gray-500">Loading preferences...</p>
            </div>
        );
    }

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

            {/* Automatic Learning Toggle */}
            <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1 pr-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Automatic learning</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        AI learns from signals in your prompts to better understand your preferences
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={preferences.auto_learn}
                        onChange={(e) => onPreferenceChange('auto_learn', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
            </div>

            {/* Communication Style */}
            <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Communication style</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'simple', label: 'Simple' },
                        { value: 'conversational', label: 'Conversational' },
                        { value: 'technical', label: 'Technical' },
                    ].map((option) => (
                        <PreferenceButton
                            key={option.value}
                            option={option}
                            value={option.value}
                            isSelected={preferences.communication_style === option.value}
                            onClick={(val) => onPreferenceChange('communication_style', val)}
                        />
                    ))}
                </div>
            </div>

            {/* Answer Length */}
            <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Answer length</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'brief', label: 'Brief' },
                        { value: 'balanced', label: 'Balanced' },
                        { value: 'detailed', label: 'Detailed' },
                    ].map((option) => (
                        <PreferenceButton
                            key={option.value}
                            option={option}
                            value={option.value}
                            isSelected={preferences.answer_length === option.value}
                            onClick={(val) => onPreferenceChange('answer_length', val)}
                        />
                    ))}
                </div>
            </div>

            {/* Teaching Aids */}
            <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Teaching aids</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'examples', label: 'Examples' },
                        { value: 'real_world', label: 'Real-world' },
                        { value: 'analogies', label: 'Analogies' },
                        { value: 'step_by_step', label: 'Step-by-step' },
                    ].map((option) => (
                        <PreferenceButton
                            key={option.value}
                            option={option}
                            value={option.value}
                            isSelected={preferences.teaching_aids?.includes(option.value) || false}
                            onClick={(val) => onArrayToggle('teaching_aids', val)}
                        />
                    ))}
                </div>
            </div>

            {/* Visual Aids */}
            <div className="py-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Visual aids</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'lists', label: 'Lists' },
                        { value: 'tables', label: 'Tables' },
                        { value: 'diagrams', label: 'Diagrams' },
                    ].map((option) => (
                        <PreferenceButton
                            key={option.value}
                            option={option}
                            value={option.value}
                            isSelected={preferences.visual_aids?.includes(option.value) || false}
                            onClick={(val) => onArrayToggle('visual_aids', val)}
                        />
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    variant="primary"
                    onClick={onSave}
                    disabled={saving || loading}
                    className="!bg-emerald-600 hover:!bg-emerald-700 cursor-pointer"
                    size="sm"
                >
                    {saving ? (
                        <>
                            <BiLoaderAlt className="w-3 h-3 animate-spin mr-1" />
                            Saving...
                        </>
                    ) : (
                        'Save changes'
                    )}
                </Button>
                <Button
                    variant="secondary"
                    leftIcon={<MdRefresh className="w-3.5 h-3.5" />}
                    onClick={onReset}
                    disabled={saving || loading}
                    className="cursor-pointer"
                    size="sm"
                >
                    Reset
                </Button>
            </div>
        </div>
    );
};
