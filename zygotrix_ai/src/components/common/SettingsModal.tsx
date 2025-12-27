import React, { useState, useEffect } from 'react';
import { MdPsychology, MdCheckCircle, MdError, MdRefresh, MdClose } from 'react-icons/md';
import { BiLoaderAlt } from 'react-icons/bi';
import authService from '../../services/auth/auth.service';
import type { ChatPreferences, UserPreferencesUpdate } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preferences'>('preferences');
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !preferences) {
      fetchPreferences();
    }
  }, [isOpen]);

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
      setTimeout(() => onClose(), 1500);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
              Manage your AI preferences
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <MdClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6">
          <nav className="flex gap-4 sm:gap-8">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'preferences'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <MdPsychology className="w-5 h-5" />
              AI Behavior
            </button>
            {/* Future tabs can be added here */}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Automatic Learning
                          </label>
                          {preferences.auto_learn && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Communication Style
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { value: 'simple', label: 'Simple', desc: 'Everyday language' },
                        { value: 'conversational', label: 'Conversational', desc: 'Friendly, balanced tone' },
                        { value: 'technical', label: 'Technical', desc: 'Scientific terminology' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePreferenceChange('communication_style', option.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.communication_style === option.value
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.communication_style === option.value
                                  ? 'border-indigo-600 bg-indigo-600'
                                  : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                              {preferences.communication_style === option.value && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Answer Length */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Answer Length
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { value: 'brief', label: 'Brief', desc: 'Concise, key points' },
                        { value: 'balanced', label: 'Balanced', desc: 'Neither too brief nor too long' },
                        { value: 'detailed', label: 'Detailed', desc: 'Comprehensive explanations' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePreferenceChange('answer_length', option.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.answer_length === option.value
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.answer_length === option.value
                                  ? 'border-indigo-600 bg-indigo-600'
                                  : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                              {preferences.answer_length === option.value && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teaching Aids */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Teaching Aids <span className="text-xs text-gray-500">(Select multiple)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {[
                        { value: 'examples', label: 'Examples', desc: 'Include practical examples' },
                        { value: 'real_world', label: 'Real-World', desc: 'Real-world applications' },
                        { value: 'analogies', label: 'Analogies', desc: 'Use comparisons' },
                        { value: 'step_by_step', label: 'Step-by-Step', desc: 'Break down processes' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePreferenceArrayToggle('teaching_aids', option.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.teaching_aids?.includes(option.value)
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${preferences.teaching_aids?.includes(option.value)
                                  ? 'border-indigo-600 bg-indigo-600'
                                  : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                              {preferences.teaching_aids?.includes(option.value) && (
                                <MdCheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Aids */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Visual Aids <span className="text-xs text-gray-500">(Select multiple)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { value: 'lists', label: 'Lists', desc: 'Bullet points' },
                        { value: 'tables', label: 'Tables', desc: 'Structured data' },
                        { value: 'diagrams', label: 'Diagrams', desc: 'Visual representations' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePreferenceArrayToggle('visual_aids', option.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.visual_aids?.includes(option.value)
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${preferences.visual_aids?.includes(option.value)
                                  ? 'border-indigo-600 bg-indigo-600'
                                  : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                              {preferences.visual_aids?.includes(option.value) && (
                                <MdCheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load preferences
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleReset}
            disabled={saving || loading}
            className="order-2 sm:order-1 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <MdRefresh className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="order-1 sm:order-2 flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !preferences}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <BiLoaderAlt className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
