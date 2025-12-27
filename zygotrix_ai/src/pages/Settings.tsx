import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { MdPsychology, MdCheckCircle, MdError, MdRefresh } from 'react-icons/md';
import { BiLoaderAlt } from 'react-icons/bi';
import authService from '../services/auth/auth.service';
import type { ChatPreferences, UserPreferencesUpdate } from '../types';
import { Button, IconButton } from '../components/common';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'preferences'>('preferences');
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getUserPreferences();
      setPreferences(data);
    } catch (err) {
      setError('Failed to load preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (
    field: keyof ChatPreferences,
    value: string | string[] | boolean
  ) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [field]: value });
  };

  const handlePreferenceArrayToggle = (
    field: 'teaching_aids' | 'visual_aids',
    value: string
  ) => {
    if (!preferences) return;
    const currentArray = preferences[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    setPreferences({ ...preferences, [field]: newArray });
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: UserPreferencesUpdate = {
        communication_style: preferences.communication_style,
        answer_length: preferences.answer_length,
        teaching_aids: preferences.teaching_aids,
        visual_aids: preferences.visual_aids,
        auto_learn: preferences.auto_learn,
      };
      const updated = await authService.updateUserPreferences(payload);
      setPreferences(updated);
      setSuccess('Preferences updated successfully!');
    } catch (err) {
      setError('Failed to update preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all preferences to defaults?')) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const defaults = await authService.resetUserPreferences();
      setPreferences(defaults);
      setSuccess('Preferences reset to defaults!');
    } catch (err) {
      setError('Failed to reset preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <IconButton
              icon={<FiArrowLeft />}
              onClick={() => navigate('/chat')}
              tooltip="Back to chat"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your AI preferences and account settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'preferences'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MdPsychology className="w-5 h-5" />
                AI Behavior
              </div>
            </button>
            {/* Future tabs can be added here */}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <BiLoaderAlt className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-500">Loading preferences...</p>
              </div>
            ) : preferences ? (
              <>
                {/* Info Banner */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <MdPsychology className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-1">
                        How AI Behavior Preferences Work
                      </h3>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400">
                        Configure how Zigi responds to you. The AI can automatically learn your preferences from your prompts, or you can manually configure them here.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Success/Error Notifications */}
                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <MdError className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Automatic Learning Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                          Automatic Learning
                        </label>
                        {preferences.auto_learn && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        AI automatically detects and learns from signals in your prompts
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.auto_learn}
                        onChange={(e) => handlePreferenceChange('auto_learn', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>

                {/* Communication Style */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <label className="block text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Communication Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { value: 'simple', label: 'Simple', desc: 'Everyday language' },
                      { value: 'conversational', label: 'Conversational', desc: 'Friendly, balanced tone' },
                      { value: 'technical', label: 'Technical', desc: 'Scientific terminology' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePreferenceChange('communication_style', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          preferences.communication_style === option.value
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              preferences.communication_style === option.value
                                ? 'border-indigo-600 bg-indigo-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {preferences.communication_style === option.value && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-7">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Answer Length */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <label className="block text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Answer Length
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { value: 'brief', label: 'Brief', desc: 'Concise, key points' },
                      { value: 'balanced', label: 'Balanced', desc: 'Neither too brief nor too long' },
                      { value: 'detailed', label: 'Detailed', desc: 'Comprehensive explanations' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePreferenceChange('answer_length', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          preferences.answer_length === option.value
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              preferences.answer_length === option.value
                                ? 'border-indigo-600 bg-indigo-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {preferences.answer_length === option.value && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-7">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teaching Aids */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <label className="block text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Teaching Aids
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select multiple</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { value: 'examples', label: 'Examples', desc: 'Include practical examples' },
                      { value: 'real_world', label: 'Real-World', desc: 'Real-world applications' },
                      { value: 'analogies', label: 'Analogies', desc: 'Use comparisons' },
                      { value: 'step_by_step', label: 'Step-by-Step', desc: 'Break down processes' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePreferenceArrayToggle('teaching_aids', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          preferences.teaching_aids?.includes(option.value)
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              preferences.teaching_aids?.includes(option.value)
                                ? 'border-indigo-600 bg-indigo-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {preferences.teaching_aids?.includes(option.value) && (
                              <MdCheckCircle className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-7">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Aids */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <label className="block text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Visual Aids
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select multiple</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { value: 'lists', label: 'Lists', desc: 'Bullet points' },
                      { value: 'tables', label: 'Tables', desc: 'Structured data' },
                      { value: 'diagrams', label: 'Diagrams', desc: 'Visual representations' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePreferenceArrayToggle('visual_aids', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          preferences.visual_aids?.includes(option.value)
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              preferences.visual_aids?.includes(option.value)
                                ? 'border-indigo-600 bg-indigo-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {preferences.visual_aids?.includes(option.value) && (
                              <MdCheckCircle className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-7">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between gap-4 pt-4">
                  <Button
                    variant="secondary"
                    leftIcon={<MdRefresh />}
                    onClick={handleReset}
                    disabled={saving || loading}
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || loading || !preferences}
                    className="!bg-indigo-600 hover:!bg-indigo-700"
                  >
                    {saving ? (
                      <>
                        <BiLoaderAlt className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load preferences</p>
                <Button
                  variant="secondary"
                  onClick={fetchPreferences}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
