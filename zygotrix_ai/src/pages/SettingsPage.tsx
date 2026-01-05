import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiActivity, FiCreditCard } from 'react-icons/fi';
import { MdPsychology } from 'react-icons/md';
import { BiLoaderAlt } from 'react-icons/bi';
import { MainLayout } from '../components/layout';
import { usePreferences } from '../contexts';
import type { ChatPreferences, UserPreferencesUpdate } from '../types';
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

// Lazy load settings sections - P1 Optimization (2.3)
const GeneralSection = React.lazy(() => import('../components/settings/GeneralSection').then(module => ({ default: module.GeneralSection })));
const LearningSection = React.lazy(() => import('../components/settings/LearningSection').then(module => ({ default: module.LearningSection })));
const UsageSection = React.lazy(() => import('../components/settings/UsageSection').then(module => ({ default: module.UsageSection })));
const BillingSection = React.lazy(() => import('../components/settings/BillingSection').then(module => ({ default: module.BillingSection })));

const SectionLoader = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <BiLoaderAlt className="w-6 h-6 text-emerald-600 animate-spin" />
    <p className="text-sm text-gray-500">Loading section...</p>
  </div>
);

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get active section from URL hash or default to 'general'
  const getActiveSection = () => {
    const hash = location.hash.replace('#', '');
    return SETTINGS_NAV_ITEMS.find(item => item.id === hash)?.id || 'general';
  };

  // P2 Optimization (3.1): Use shared preferences context
  const {
    preferences: contextPreferences,
    loading: prefsLoading,
    saving,
    error: prefsError,
    refreshPreferences,
    updatePreferences,
    resetPreferences
  } = usePreferences();

  const [activeSection, setActiveSection] = useState(getActiveSection);

  // Local draft state for preferences
  const [localPreferences, setLocalPreferences] = useState<ChatPreferences | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync local preferences with context when context loads (and local is empty or not dirty)
  useEffect(() => {
    if (contextPreferences && !isDirty) {
      setLocalPreferences(contextPreferences);
    }
  }, [contextPreferences, isDirty]);

  // Aggregate loading and error states
  const loading = prefsLoading; // removed loadingConvs as MainLayout handles sidebar
  const error = prefsError || localError;

  // Update URL hash when section changes
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    navigate(`/settings#${sectionId}`, { replace: true });
  };

  // P0 Optimization: Load preferences only (Sidebar conversations independent)
  useEffect(() => {
    // Ensure context is fresh
    refreshPreferences();
  }, [refreshPreferences]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setLocalError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Refetch preferences (for retry button)
  const fetchPreferences = async () => {
    // Context handles loading state
    refreshPreferences();
  };

  const handlePreferenceChange = useCallback((
    field: keyof ChatPreferences,
    value: string | string[] | boolean
  ) => {
    if (!localPreferences) return;
    setLocalPreferences({ ...localPreferences, [field]: value });
    setIsDirty(true);
  }, [localPreferences]);

  const handlePreferenceArrayToggle = useCallback((
    field: 'teaching_aids' | 'visual_aids',
    value: string
  ) => {
    if (!localPreferences) return;
    const currentArray = localPreferences[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];

    setLocalPreferences({ ...localPreferences, [field]: newArray });
    setIsDirty(true);
  }, [localPreferences]);

  // Save changes via context
  const handleSave = async () => {
    if (!localPreferences) return;

    setSuccess(null);
    setLocalError(null);

    try {
      const payload: UserPreferencesUpdate = {
        communication_style: localPreferences.communication_style,
        answer_length: localPreferences.answer_length,
        teaching_aids: localPreferences.teaching_aids,
        visual_aids: localPreferences.visual_aids,
        auto_learn: localPreferences.auto_learn,
      };

      await updatePreferences(payload);
      setSuccess('Saved!');
      setIsDirty(false); // Reset dirty flag as local is now same as saved
    } catch (err) {
      console.error(err);
      // Context sets its own error, but we can set success null here
    }
  };

  // Reset to defaults via context
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all preferences to defaults?')) return;

    setSuccess(null);
    setLocalError(null);

    try {
      await resetPreferences();
      setSuccess('Reset to defaults!');
      setIsDirty(false); // Reset dirty flag
    } catch (err) {
      console.error(err);
    }
  };

  // Render the content based on active section
  const renderContent = () => {
    return (
      <React.Suspense fallback={<SectionLoader />}>
        {activeSection === 'general' && (
          <GeneralSection
            loading={loading}
            preferences={localPreferences || contextPreferences}
            success={success}
            error={error}
            onRefresh={fetchPreferences}
          />
        )}
        {activeSection === 'learning' && (
          <LearningSection
            loading={loading}
            preferences={localPreferences || contextPreferences}
            saving={saving}
            success={success}
            error={error}
            onRefresh={fetchPreferences}
            onSave={handleSave}
            onReset={handleReset}
            onPreferenceChange={handlePreferenceChange}
            onArrayToggle={handlePreferenceArrayToggle}
          />
        )}
        {activeSection === 'usage' && <UsageSection />}
        {activeSection === 'billing' && <BillingSection />}
      </React.Suspense>
    );
  };

  return (
    <MainLayout>
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
