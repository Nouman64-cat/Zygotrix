/**
 * Conversation Modals
 * ===================
 * Settings, Share, Export, and Preferences modals for conversations.
 */

import { useState, useEffect } from "react";
import { HiX, HiLink, HiCheck, HiDownload, HiCog } from "react-icons/hi";
import { MdPsychology, MdCheckCircle, MdError, MdRefresh } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import type { ConversationSettings, ExportFormat } from "../../services/zygotrixAI.api";
import type { ChatPreferences } from "../../types/auth";
import * as api from "../../services/zygotrixAI.api";
import * as authApi from "../../services/auth.api";

// =============================================================================
// SETTINGS MODAL
// =============================================================================

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ConversationSettings;
  onSave: (settings: ConversationSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [models, setModels] = useState<api.AIModel[]>([]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    api.getModels().then(({ models }) => setModels(models)).catch(console.error);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <HiCog className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversation Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Model
            </label>
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temperature: {localSettings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Response Length
            </label>
            <select
              value={localSettings.max_tokens}
              onChange={(e) => setLocalSettings({ ...localSettings, max_tokens: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="512">Short (512 tokens)</option>
              <option value="1024">Medium (1024 tokens)</option>
              <option value="2048">Long (2048 tokens)</option>
              <option value="4096">Very Long (4096 tokens)</option>
            </select>
          </div>

          {/* Context Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context Messages: {localSettings.context_window_messages}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={localSettings.context_window_messages}
              onChange={(e) => setLocalSettings({ ...localSettings, context_window_messages: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              How many previous messages to include for context
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={localSettings.system_prompt || ""}
              onChange={(e) => setLocalSettings({ ...localSettings, system_prompt: e.target.value || undefined })}
              placeholder="Add custom instructions for the AI..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localSettings.stream_response}
                onChange={(e) => setLocalSettings({ ...localSettings, stream_response: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Stream responses (show text as it generates)
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localSettings.include_system_context}
                onChange={(e) => setLocalSettings({ ...localSettings, include_system_context: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include Zygotrix genetics context
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SHARE MODAL
// =============================================================================

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  isShared: boolean;
  shareId?: string;
  onShare: () => Promise<api.ShareResponse>;
  onUnshare: () => Promise<void>;
}

export function ShareModal({
  isOpen,
  onClose,
  conversationId: _conversationId,
  isShared,
  shareId,
  onShare,
  onUnshare,
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isShared && shareId) {
      setShareUrl(`${window.location.origin}/shared/${shareId}`);
    } else {
      setShareUrl("");
    }
  }, [isShared, shareId]);

  if (!isOpen) return null;

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await onShare();
      setShareUrl(response.share_url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async () => {
    setLoading(true);
    try {
      await onUnshare();
      setShareUrl("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <HiLink className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Share Conversation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {shareUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anyone with this link can view this conversation.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <HiCheck className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>

              <button
                onClick={handleUnshare}
                disabled={loading}
                className="w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                {loading ? "Removing..." : "Remove Share Link"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a public link to share this conversation with others. They will be able to view the messages but not modify them.
              </p>

              <button
                onClick={handleShare}
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {loading ? "Creating Link..." : "Create Share Link"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT MODAL
// =============================================================================

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle: string;
  onExport: (format: ExportFormat) => Promise<void>;
}

export function ExportModal({
  isOpen,
  onClose,
  conversationId: _conversationId,
  conversationTitle,
  onExport,
}: ExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");

  if (!isOpen) return null;

  const formats: { id: ExportFormat; name: string; description: string; icon: string }[] = [
    { id: "markdown", name: "Markdown", description: "Formatted text with headers", icon: "📝" },
    { id: "json", name: "JSON", description: "Structured data for developers", icon: "{ }" },
    { id: "txt", name: "Plain Text", description: "Simple text format", icon: "📄" },
  ];

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport(selectedFormat);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <HiDownload className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Export Conversation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export &quot;{conversationTitle}&quot; in your preferred format.
          </p>

          {/* Format Selection */}
          <div className="space-y-2">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedFormat === format.id
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                <span className="text-xl">{format.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format.name}
                  </div>
                  <div className="text-xs text-gray-500">{format.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
          >
            <HiDownload className="w-4 h-4" />
            {loading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// NEW FOLDER MODAL
// =============================================================================

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color?: string) => Promise<void>;
}

export function NewFolderModal({ isOpen, onClose, onCreate }: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);

  const colors = [
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#0ea5e9", // sky
    "#6b7280", // gray
  ];

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), color);
      setName("");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            New Folder
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                    }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {loading ? "Creating..." : "Create Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PREFERENCES MODAL
// =============================================================================

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
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
      const data = await authApi.getUserPreferences();
      setPreferences(data);
    } catch (err) {
      setError("Failed to load preferences");
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
    field: "teaching_aids" | "visual_aids",
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
      const updated = await authApi.updateUserPreferences({
        communication_style: preferences.communication_style,
        answer_length: preferences.answer_length,
        teaching_aids: preferences.teaching_aids,
        visual_aids: preferences.visual_aids,
        auto_learn: preferences.auto_learn,
      });
      setPreferences(updated);
      setSuccess("Preferences updated successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError("Failed to update preferences");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all preferences to defaults?")) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const defaults = await authApi.resetUserPreferences();
      setPreferences(defaults);
      setSuccess("Preferences reset to defaults!");
    } catch (err) {
      setError("Failed to reset preferences");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MdPsychology className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Behavior Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
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
                      onChange={(e) => handlePreferenceChange("auto_learn", e.target.checked)}
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "simple", label: "Simple", desc: "Everyday language" },
                    { value: "conversational", label: "Conversational", desc: "Friendly, balanced tone" },
                    { value: "technical", label: "Technical", desc: "Scientific terminology" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceChange("communication_style", option.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.communication_style === option.value
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.communication_style === option.value
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300 dark:border-gray-600"
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "brief", label: "Brief", desc: "Concise, key points" },
                    { value: "balanced", label: "Balanced", desc: "Neither too brief nor too long" },
                    { value: "detailed", label: "Detailed", desc: "Comprehensive explanations" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceChange("answer_length", option.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.answer_length === option.value
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${preferences.answer_length === option.value
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300 dark:border-gray-600"
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
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "examples", label: "Examples", desc: "Include practical examples" },
                    { value: "real_world", label: "Real-World", desc: "Real-world applications" },
                    { value: "analogies", label: "Analogies", desc: "Use comparisons" },
                    { value: "step_by_step", label: "Step-by-Step", desc: "Break down processes" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceArrayToggle("teaching_aids", option.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.teaching_aids?.includes(option.value)
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${preferences.teaching_aids?.includes(option.value)
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300 dark:border-gray-600"
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "lists", label: "Lists", desc: "Bullet points" },
                    { value: "tables", label: "Tables", desc: "Structured data" },
                    { value: "diagrams", label: "Diagrams", desc: "Visual representations" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceArrayToggle("visual_aids", option.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${preferences.visual_aids?.includes(option.value)
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${preferences.visual_aids?.includes(option.value)
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300 dark:border-gray-600"
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

        {/* Footer */}
        <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleReset}
            disabled={saving || loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <MdRefresh className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !preferences}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
            >
              {saving ? (
                <>
                  <BiLoaderAlt className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
