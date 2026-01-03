import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiActivity, FiCreditCard } from 'react-icons/fi';
import { MdCheckCircle, MdError, MdRefresh, MdPsychology, MdStar, MdMic, MdBolt, MdAnalytics } from 'react-icons/md';
import { BiLoaderAlt } from 'react-icons/bi';
import { MainLayout } from '../components/layout';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';
import { RateLimitIndicator } from '../components/chat';
import authService from '../services/auth/auth.service';
import { chatService } from '../services';
import { useAuth } from '../contexts';
import type { ChatPreferences, UserPreferencesUpdate, LocalConversation } from '../types';
import { Button } from '../components/common';
import { cn } from '../utils';

// Settings navigation items
interface SettingsNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: <FiUser className="w-4 h-4" />,
  },
  {
    id: 'learning',
    label: 'AI Learning',
    icon: <MdPsychology className="w-4 h-4" />,
  },
  {
    id: 'usage',
    label: 'Usage',
    icon: <FiActivity className="w-4 h-4" />,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <FiCreditCard className="w-4 h-4" />,
  },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  // Get active section from URL hash or default to 'general'
  const getActiveSection = () => {
    const hash = location.hash.replace('#', '');
    return SETTINGS_NAV_ITEMS.find(item => item.id === hash)?.id || 'general';
  };

  const [activeSection, setActiveSection] = useState(getActiveSection);
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rateLimitRefresh, setRateLimitRefresh] = useState(0);

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
      setSuccess('Preferences saved successfully!');
    } catch (err) {
      setError('Failed to save preferences');
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Render the General section (Profile + Learning + Appearance)
  const renderGeneralSection = () => {
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
            onClick={fetchPreferences}
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

  // Render the Learning section
  const renderLearningSection = () => {
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
            onClick={fetchPreferences}
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
              onChange={(e) => handlePreferenceChange('auto_learn', e.target.checked)}
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
              <button
                key={option.value}
                onClick={() => handlePreferenceChange('communication_style', option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer',
                  preferences.communication_style === option.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {option.label}
              </button>
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
              <button
                key={option.value}
                onClick={() => handlePreferenceChange('answer_length', option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer',
                  preferences.answer_length === option.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {option.label}
              </button>
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
              <button
                key={option.value}
                onClick={() => handlePreferenceArrayToggle('teaching_aids', option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer',
                  preferences.teaching_aids?.includes(option.value)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {option.label}
              </button>
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
              <button
                key={option.value}
                onClick={() => handlePreferenceArrayToggle('visual_aids', option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer',
                  preferences.visual_aids?.includes(option.value)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="primary"
            onClick={handleSave}
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
            onClick={handleReset}
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


  // Render the Usage section with Rate Limit
  const renderUsageSection = () => {
    return (
      <div className="space-y-8">
        {/* Usage Stats Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Token Usage</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track your AI usage and remaining tokens
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<MdRefresh className="w-4 h-4" />}
              onClick={() => setRateLimitRefresh(prev => prev + 1)}
              className="cursor-pointer w-full sm:w-auto"
            >
              Refresh
            </Button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <RateLimitIndicator
              refreshTrigger={rateLimitRefresh}
              onRateLimitChange={() => { }}
            />
          </div>
        </section>

        {/* Usage Info */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">About Usage Limits</h2>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Token limits help ensure fair usage across all users. Each message you send and receive consumes tokens.
            </p>
            <p>
              Your token allocation resets periodically. When you reach the limit, you'll need to wait for the cooldown period to end before continuing.
            </p>
            <p>
              Tips to optimize token usage:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Be concise in your prompts</li>
              <li>Request "brief" answers for simple questions</li>
              <li>Avoid repetitive follow-up messages</li>
            </ul>
          </div>
        </section>
      </div>
    );
  };

  // Render the Billing section
  const renderBillingSection = () => {
    return (
      <div className="space-y-8">
        {/* Current Plan */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Free Tier
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Basic access with standard rate limits
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Plan */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Upgrade to Premium</h2>

          {/* Premium Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[1px]">
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                  <MdStar className="w-3 h-3" />
                  RECOMMENDED
                </span>
              </div>

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Zygotrix Premium</h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">Rs. 3,000</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <MdBolt className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Generous Usage Limits</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">10x more tokens per day for extended conversations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <MdMic className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Advanced Voice Features</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Voice commands, dictation, and AI voice responses</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <MdAnalytics className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Advanced Analysis Tools</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">GWAS analysis, protein structure prediction, and more</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <MdStar className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Priority Support</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Get help faster with dedicated support channels</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 cursor-pointer"
                onClick={() => alert('Payment integration coming soon!')}
              >
                Upgrade Now
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Cancel anytime. No questions asked.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">What payment methods are accepted?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">We accept all major credit/debit cards, JazzCash, Easypaisa, and bank transfers.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Can I cancel my subscription?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Yes, you can cancel anytime from this page. Your access continues until the billing period ends.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">What happens if I exceed my limits?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">With Premium, you get much higher limits. If exceeded, you'll simply wait for a brief cooldown.</p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Render the content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSection();
      case 'learning':
        return renderLearningSection();
      case 'usage':
        return renderUsageSection();
      case 'billing':
        return renderBillingSection();
      default:
        return renderGeneralSection();
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
      <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
        {/* Centered Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-24 pb-6 sm:pb-8 lg:pb-12">
          {/* Page Title */}
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-6 lg:mb-8">Settings</h1>

          {/* Mobile: Horizontal Tab Navigation */}
          <div className="lg:hidden mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2">
              {SETTINGS_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer flex-shrink-0',
                    activeSection === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content with Settings Sidebar */}
          <div className="lg:flex lg:gap-12">
            {/* Desktop: Settings Sidebar Navigation */}
            <nav className="hidden lg:block w-44 flex-shrink-0">
              <div className="space-y-1">
                {SETTINGS_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
                      activeSection === item.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content Area */}
            <div className="flex-1 max-w-2xl">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
