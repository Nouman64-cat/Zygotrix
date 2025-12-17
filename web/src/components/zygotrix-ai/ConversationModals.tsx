/**
 * Conversation Modals
 * ===================
 * Settings, Share, and Export modals for conversations.
 */

import { useState, useEffect } from "react";
import { HiX, HiLink, HiCheck, HiDownload, HiCog } from "react-icons/hi";
import type { ConversationSettings, ExportFormat } from "../../services/zygotrixAI.api";
import * as api from "../../services/zygotrixAI.api";

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
