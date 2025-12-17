/**
 * Zygotrix AI Chat Page
 * =====================
 * Professional ChatGPT-like interface for Zygotrix AI.
 * Features conversations, folders, sharing, and export.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ZygotrixAIProvider, useZygotrixAI } from "../context/ZygotrixAIContext";
import { useAuth } from "../context/AuthContext";
import {
  ConversationSidebar,
  ChatInterface,
  SettingsModal,
  ShareModal,
  ExportModal,
} from "../components/zygotrix-ai";
import type { ConversationSettings, ExportFormat } from "../services/zygotrixAI.api";
import { LuBiohazard } from "react-icons/lu";

// Inner component that uses the context
function ZygotrixAIChatContent() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  // searchParams can be used for future features like ?model=xyz

  const { user } = useAuth();
  const {
    state,
    selectConversation,
    updateConversation,
    shareConversation,
    unshareConversation,
    exportConversation,
    loadConversations,
  } = useZygotrixAI();

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Track if initial URL conversation has been loaded
  const initialLoadRef = useRef(false);
  const urlConversationIdRef = useRef(conversationId);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle URL-based conversation selection on initial load and URL changes
  useEffect(() => {
    // If we have a conversationId from URL and it's different from current
    if (conversationId && conversationId !== state.currentConversation?.id) {
      selectConversation(conversationId);
      initialLoadRef.current = true;
    }
    // If URL has conversationId and we haven't loaded it yet (for page refresh case)
    else if (conversationId && !state.currentConversation && !state.isLoading && !initialLoadRef.current) {
      selectConversation(conversationId);
      initialLoadRef.current = true;
    }
  }, [conversationId, selectConversation, state.currentConversation?.id, state.isLoading, state.currentConversation]);

  // Update URL when conversation changes (but not from URL navigation)
  useEffect(() => {
    if (state.currentConversation?.id && state.currentConversation.id !== conversationId) {
      navigate(`/ai/c/${state.currentConversation.id}`, { replace: true });
    }
  }, [state.currentConversation?.id, conversationId, navigate]);

  // Reset initial load ref when URL changes to a different conversation
  useEffect(() => {
    if (conversationId !== urlConversationIdRef.current) {
      initialLoadRef.current = false;
      urlConversationIdRef.current = conversationId;
    }
  }, [conversationId]);

  // Handle settings save
  const handleSaveSettings = async (settings: ConversationSettings) => {
    if (state.currentConversation) {
      await updateConversation(state.currentConversation.id, { settings });
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!state.currentConversation) return { share_id: "", share_url: "" };
    return shareConversation(state.currentConversation.id);
  };

  // Handle unshare
  const handleUnshare = async () => {
    if (!state.currentConversation) return;
    await unshareConversation(state.currentConversation.id);
  };

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    if (!state.currentConversation) return;
    await exportConversation(state.currentConversation.id, format);
  };

  // Check authentication
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0b]">
        <div className="text-center">
          <LuBiohazard className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Sign in to use Zygotrix AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create an account or sign in to start chatting.
          </p>
          <button
            onClick={() => navigate("/signin")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-[#0a0a0b]">
      {/* Sidebar */}
      <ConversationSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          onOpenSettings={() => setShowSettings(true)}
          onShare={() => setShowShare(true)}
          onExport={() => setShowExport(true)}
        />
      </div>

      {/* Modals */}
      {state.currentConversation && (
        <>
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            settings={state.currentConversation.settings}
            onSave={handleSaveSettings}
          />

          <ShareModal
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            conversationId={state.currentConversation.id}
            isShared={state.currentConversation.is_shared}
            shareId={state.currentConversation.share_id}
            onShare={handleShare}
            onUnshare={handleUnshare}
          />

          <ExportModal
            isOpen={showExport}
            onClose={() => setShowExport(false)}
            conversationId={state.currentConversation.id}
            conversationTitle={state.currentConversation.title}
            onExport={handleExport}
          />
        </>
      )}
    </div>
  );
}

// Main page component with provider
export default function ZygotrixAIChatPage() {
  return (
    <ZygotrixAIProvider>
      <ZygotrixAIChatContent />
    </ZygotrixAIProvider>
  );
}
