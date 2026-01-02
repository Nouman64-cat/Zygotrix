import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMoon, FiChevronRight } from 'react-icons/fi';
import { MdPsychology, MdCheckCircle, MdError, MdRefresh } from 'react-icons/md';
import { BiLoaderAlt } from 'react-icons/bi';
import { MainLayout } from '../components/layout';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';
import authService from '../services/auth/auth.service';
import { chatService } from '../services';
import type { ChatPreferences, UserPreferencesUpdate, LocalConversation } from '../types';
import { Button } from '../components/common';
import { cn } from '../utils';

// Settings navigation items
interface SettingsNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: 'learning',
    label: 'Automatic Learning',
    icon: <MdPsychology className="w-5 h-5" />,
    description: 'AI learning preferences',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <FiMoon className="w-5 h-5" />,
    description: 'Theme and display settings',
  },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Conversations state for MainLayout sidebar
  const [conversationsList, setConversationsList] = useState<LocalConversation[]>(() => {
    try {
      const cached = localStorage.getItem('zygotrix_conversations');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.warn('Failed to parse cached conversations', e);
      return [];
    }
  });

  // Get active section from URL hash or default to 'learning'
  const getActiveSection = () => {
    const hash = location.hash.replace('#', '');
    return SETTINGS_NAV_ITEMS.find(item => item.id === hash)?.id || 'learning';
  };
  
  const [activeSection, setActiveSection] = useState(getActiveSection);
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load conversations for sidebar
  const loadConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations({ page_size: 50 });
      const localConversations: LocalConversation[] = response.conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: [],
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        isPinned: conv.is_pinned,
      }));
      setConversationsList(localConversations);
      localStorage.setItem('zygotrix_conversations', JSON.stringify(localConversations));
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  // Sort conversations: Pinned first, then by date
  const sortedConversations = useMemo(() => {
    return [...conversationsList].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [conversationsList]);

  // Sidebar handlers
  const handleNewConversation = () => {
    navigate('/chat');
  };

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await chatService.deleteConversation(id);
      setConversationsList(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      setConversationsList(prev => prev.map(c =>
        c.id === id ? { ...c, title: newTitle } : c
      ));
      await chatService.updateConversation(id, { title: newTitle });
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      loadConversations();
    }
  };

  const handlePinConversation = async (id: string, isPinned: boolean) => {
    try {
      setConversationsList(prev => prev.map(c =>
        c.id === id ? { ...c, isPinned } : c
      ));
      await chatService.updateConversation(id, { is_pinned: isPinned });
    } catch (err) {
      console.error('Failed to pin conversation:', err);
      loadConversations();
    }
  };

  // Update URL hash when section changes
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    navigate(`/settings#${sectionId}`, { replace: true });
  };

  useEffect(() => {
    loadConversations();
    fetchPreferences();
  }, [loadConversations]);

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

  // Render the Automatic Learning section
  const renderLearningSection = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <BiLoaderAlt className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading preferences...</p>
        </div>
      );
    }

    if (!preferences) {
      return (
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
      );
    }

    return (
      <div className="space-y-6">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Enable Automatic Learning
                </label>
                {preferences.auto_learn && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                AI automatically detects and learns from signals in your prompts to better understand your preferences
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.auto_learn}
                onChange={(e) => handlePreferenceChange('auto_learn', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Communication Style */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left cursor-pointer',
                  preferences.communication_style === option.value
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      preferences.communication_style === option.value
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left cursor-pointer',
                  preferences.answer_length === option.value
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      preferences.answer_length === option.value
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left cursor-pointer',
                  preferences.teaching_aids?.includes(option.value)
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      preferences.teaching_aids?.includes(option.value)
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left cursor-pointer',
                  preferences.visual_aids?.includes(option.value)
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      preferences.visual_aids?.includes(option.value)
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
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
            className="cursor-pointer"
          >
            Reset to Defaults
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading || !preferences}
            className="!bg-emerald-600 hover:!bg-emerald-700 cursor-pointer"
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
      </div>
    );
  };

  // Render the Appearance section
  const renderAppearanceSection = () => {
    return (
      <div className="space-y-6">
        {/* Color Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 dark:text-white">Color mode</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred color scheme for the interface
            </p>
          </div>
          
          <ThemeSwitcher variant="cards" />
        </div>

        {/* Future appearance settings can be added here */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            More appearance options coming soon...
          </p>
        </div>
      </div>
    );
  };

  // Render the content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'learning':
        return renderLearningSection();
      case 'appearance':
        return renderAppearanceSection();
      default:
        return renderLearningSection();
    }
  };

  return (
    <MainLayout
      conversations={sortedConversations}
      currentConversationId={undefined}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={handleDeleteConversation}
      onRenameConversation={handleRenameConversation}
      onPinConversation={handlePinConversation}
    >
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {/* Settings Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your AI preferences and appearance
            </p>
          </div>
        </div>

        {/* Main Content with Settings Sidebar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Settings Sidebar Navigation */}
            <nav className="lg:w-56 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
                {SETTINGS_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
                      'border-l-4',
                      activeSection === item.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-emerald-600 text-emerald-700 dark:text-emerald-400'
                        : 'border-l-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    <span className={cn(
                      activeSection === item.id
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <FiChevronRight className={cn(
                      'w-4 h-4 transition-opacity',
                      activeSection === item.id ? 'opacity-100' : 'opacity-0'
                    )} />
                  </button>
                ))}
              </div>
            </nav>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {/* Section Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {SETTINGS_NAV_ITEMS.find(item => item.id === activeSection)?.label}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {activeSection === 'learning' 
                    ? 'Configure how Zygotrix AI learns and adapts to your preferences'
                    : 'Customize how Zygotrix AI looks and feels'}
                </p>
              </div>
              
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
