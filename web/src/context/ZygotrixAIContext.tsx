/**
 * Zygotrix AI Context
 * ====================
 * Global state management for the Zygotrix AI chat interface.
 * Manages conversations, messages, folders, and streaming state.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from "react";
import * as api from "../services/zygotrixAI.api";
import type {
  Conversation,
  ConversationSummary,
  Message,
  Folder,
  StatusResponse,
} from "../services/zygotrixAI.api";

// =============================================================================
// TYPES
// =============================================================================

interface ZygotrixAIState {
  // Conversations
  conversations: ConversationSummary[];
  currentConversation: Conversation | null;
  messages: Message[];

  // Folders
  folders: Folder[];
  currentFolderId: string | null;

  // UI State
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Sidebar
  sidebarCollapsed: boolean;

  // Status
  status: StatusResponse | null;

  // Pagination
  hasMoreConversations: boolean;
  hasMoreMessages: boolean;
  currentPage: number;
}

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CONVERSATIONS"; payload: { conversations: ConversationSummary[]; hasMore: boolean; page: number } }
  | { type: "APPEND_CONVERSATIONS"; payload: { conversations: ConversationSummary[]; hasMore: boolean; page: number } }
  | { type: "SET_CURRENT_CONVERSATION"; payload: Conversation | null }
  | { type: "SET_MESSAGES"; payload: { messages: Message[]; hasMore: boolean } }
  | { type: "APPEND_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; updates: Partial<Message> } }
  | { type: "SET_FOLDERS"; payload: Folder[] }
  | { type: "SET_CURRENT_FOLDER"; payload: string | null }
  | { type: "SET_STREAMING"; payload: boolean }
  | { type: "SET_STREAMING_CONTENT"; payload: string }
  | { type: "APPEND_STREAMING_CONTENT"; payload: string }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "SET_STATUS"; payload: StatusResponse | null }
  | { type: "UPDATE_CONVERSATION_IN_LIST"; payload: ConversationSummary }
  | { type: "REMOVE_CONVERSATION_FROM_LIST"; payload: string }
  | { type: "ADD_CONVERSATION_TO_LIST"; payload: ConversationSummary };

interface ZygotrixAIContextType {
  state: ZygotrixAIState;

  // Conversation actions
  loadConversations: (folderId?: string | null, search?: string) => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  selectConversation: (conversationId: string | null) => Promise<void>;
  createNewConversation: () => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (conversationId: string, permanent?: boolean) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;

  // Message actions
  sendMessage: (content: string, attachments?: api.MessageAttachment[]) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  addFeedback: (messageId: string, type: api.FeedbackType, comment?: string) => Promise<void>;

  // Folder actions
  loadFolders: () => Promise<void>;
  createFolder: (name: string, color?: string) => Promise<Folder>;
  updateFolder: (folderId: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  selectFolder: (folderId: string | null) => void;

  // Sharing actions
  shareConversation: (conversationId: string) => Promise<api.ShareResponse>;
  unshareConversation: (conversationId: string) => Promise<void>;

  // Export actions
  exportConversation: (conversationId: string, format: api.ExportFormat) => Promise<void>;

  // Search
  searchConversations: (query: string) => Promise<api.SearchResponse>;

  // UI actions
  toggleSidebar: () => void;

  // Stop streaming
  stopStreaming: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ZygotrixAIState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  folders: [],
  currentFolderId: null,
  isLoading: false,
  isStreaming: false,
  streamingContent: "",
  error: null,
  sidebarCollapsed: false,
  status: null,
  hasMoreConversations: false,
  hasMoreMessages: false,
  currentPage: 1,
};

// =============================================================================
// REDUCER
// =============================================================================

function reducer(state: ZygotrixAIState, action: Action): ZygotrixAIState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.payload.conversations,
        hasMoreConversations: action.payload.hasMore,
        currentPage: action.payload.page,
      };

    case "APPEND_CONVERSATIONS":
      return {
        ...state,
        conversations: [...state.conversations, ...action.payload.conversations],
        hasMoreConversations: action.payload.hasMore,
        currentPage: action.payload.page,
      };

    case "SET_CURRENT_CONVERSATION":
      return { ...state, currentConversation: action.payload };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload.messages,
        hasMoreMessages: action.payload.hasMore,
      };

    case "APPEND_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };

    case "UPDATE_MESSAGE": {
      const updatedMessages = state.messages.map((msg) =>
        msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
      );
      return { ...state, messages: updatedMessages };
    }

    case "SET_FOLDERS":
      return { ...state, folders: action.payload };

    case "SET_CURRENT_FOLDER":
      return { ...state, currentFolderId: action.payload };

    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload };

    case "SET_STREAMING_CONTENT":
      return { ...state, streamingContent: action.payload };

    case "APPEND_STREAMING_CONTENT":
      return { ...state, streamingContent: state.streamingContent + action.payload };

    case "SET_SIDEBAR_COLLAPSED":
      return { ...state, sidebarCollapsed: action.payload };

    case "SET_STATUS":
      return { ...state, status: action.payload };

    case "UPDATE_CONVERSATION_IN_LIST": {
      const updated = state.conversations.map((conv) =>
        conv.id === action.payload.id ? action.payload : conv
      );
      return { ...state, conversations: updated };
    }

    case "REMOVE_CONVERSATION_FROM_LIST":
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.payload),
      };

    case "ADD_CONVERSATION_TO_LIST":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const ZygotrixAIContext = createContext<ZygotrixAIContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export function ZygotrixAIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load status on mount
  useEffect(() => {
    api.getStatus().then((status) => {
      dispatch({ type: "SET_STATUS", payload: status });
    }).catch(console.error);
  }, []);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zygotrix_ai_sidebar_collapsed");
    if (saved !== null) {
      dispatch({ type: "SET_SIDEBAR_COLLAPSED", payload: JSON.parse(saved) });
    }
  }, []);

  // =============================================================================
  // CONVERSATION ACTIONS
  // =============================================================================

  const loadConversations = useCallback(async (folderId?: string | null, search?: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const response = await api.listConversations({
        folder_id: folderId || undefined,
        search: search || undefined,
        page: 1,
        page_size: 20,
      });

      dispatch({
        type: "SET_CONVERSATIONS",
        payload: {
          conversations: response.conversations,
          hasMore: response.page < response.total_pages,
          page: 1,
        },
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to load conversations" });
      console.error(err);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const loadMoreConversations = useCallback(async () => {
    if (!state.hasMoreConversations || state.isLoading) return;

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const nextPage = state.currentPage + 1;
      const response = await api.listConversations({
        folder_id: state.currentFolderId || undefined,
        page: nextPage,
        page_size: 20,
      });

      dispatch({
        type: "APPEND_CONVERSATIONS",
        payload: {
          conversations: response.conversations,
          hasMore: response.page < response.total_pages,
          page: nextPage,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.hasMoreConversations, state.isLoading, state.currentPage, state.currentFolderId]);

  const selectConversation = useCallback(async (conversationId: string | null) => {
    if (!conversationId) {
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: null });
      dispatch({ type: "SET_MESSAGES", payload: { messages: [], hasMore: false } });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const [conversation, messagesResponse] = await Promise.all([
        api.getConversation(conversationId),
        api.getMessages(conversationId, { limit: 50 }),
      ]);

      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversation });
      dispatch({
        type: "SET_MESSAGES",
        payload: {
          messages: messagesResponse.messages,
          hasMore: messagesResponse.has_more,
        },
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to load conversation" });
      console.error(err);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const createNewConversation = useCallback(() => {
    dispatch({ type: "SET_CURRENT_CONVERSATION", payload: null });
    dispatch({ type: "SET_MESSAGES", payload: { messages: [], hasMore: false } });
    dispatch({ type: "SET_STREAMING_CONTENT", payload: "" });
  }, []);

  const updateConversation = useCallback(async (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    try {
      const updated = await api.updateConversation(conversationId, updates);

      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: "SET_CURRENT_CONVERSATION", payload: updated });
      }

      // Update in list
      dispatch({
        type: "UPDATE_CONVERSATION_IN_LIST",
        payload: {
          id: updated.id,
          user_id: updated.user_id,
          title: updated.title,
          status: updated.status,
          is_pinned: updated.is_pinned,
          is_starred: updated.is_starred,
          folder_id: updated.folder_id,
          tags: updated.tags,
          message_count: updated.message_count,
          last_message_at: updated.last_message_at,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        },
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to update conversation" });
      console.error(err);
    }
  }, [state.currentConversation?.id]);

  const deleteConversation = useCallback(async (conversationId: string, permanent = false) => {
    try {
      await api.deleteConversation(conversationId, permanent);

      dispatch({ type: "REMOVE_CONVERSATION_FROM_LIST", payload: conversationId });

      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: "SET_CURRENT_CONVERSATION", payload: null });
        dispatch({ type: "SET_MESSAGES", payload: { messages: [], hasMore: false } });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to delete conversation" });
      console.error(err);
    }
  }, [state.currentConversation?.id]);

  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      await api.archiveConversation(conversationId);
      dispatch({ type: "REMOVE_CONVERSATION_FROM_LIST", payload: conversationId });

      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: "SET_CURRENT_CONVERSATION", payload: null });
        dispatch({ type: "SET_MESSAGES", payload: { messages: [], hasMore: false } });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to archive conversation" });
      console.error(err);
    }
  }, [state.currentConversation?.id]);

  // =============================================================================
  // MESSAGE ACTIONS
  // =============================================================================

  const sendMessage = useCallback(async (
    content: string,
    attachments?: api.MessageAttachment[]
  ) => {
    dispatch({ type: "SET_ERROR", payload: null });

    // Create optimistic user message
    const tempUserMessage: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: state.currentConversation?.id || "",
      role: "user",
      content,
      status: "completed",
      version: 1,
      attachments: attachments || [],
      created_at: new Date().toISOString(),
      sibling_ids: [],
      selected_sibling_index: 0,
    };

    dispatch({ type: "APPEND_MESSAGE", payload: tempUserMessage });
    dispatch({ type: "SET_STREAMING", payload: true });
    dispatch({ type: "SET_STREAMING_CONTENT", payload: "" });

    try {
      let conversationId = state.currentConversation?.id;

      // Use non-streaming API with MCP tool support
      const response = await api.sendMessage({
        conversation_id: conversationId,
        message: content,
        attachments,
        stream: false, // Disable streaming to enable MCP tools
      });

      conversationId = response.conversation_id;
      const assistantMessage = response.message;

      // Add assistant message to the list
      dispatch({ type: "APPEND_MESSAGE", payload: assistantMessage });

      // If this was a new conversation, reload conversations list
      if (!state.currentConversation && conversationId) {
        const conversation = await api.getConversation(conversationId);
        dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversation });

        dispatch({
          type: "ADD_CONVERSATION_TO_LIST",
          payload: {
            id: conversation.id,
            user_id: conversation.user_id,
            title: conversation.title,
            status: conversation.status,
            is_pinned: conversation.is_pinned,
            is_starred: conversation.is_starred,
            folder_id: conversation.folder_id,
            tags: conversation.tags,
            message_count: conversation.message_count,
            last_message_at: conversation.last_message_at,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
          },
        });
      }

    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to send message" });
      console.error(err);
    } finally {
      dispatch({ type: "SET_STREAMING", payload: false });
      dispatch({ type: "SET_STREAMING_CONTENT", payload: "" });
    }
  }, [state.currentConversation]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const regenerateMessage = useCallback(async (messageId: string) => {
    if (!state.currentConversation) return;

    dispatch({ type: "SET_STREAMING", payload: true });
    dispatch({ type: "SET_STREAMING_CONTENT", payload: "" });

    try {
      const response = await api.regenerateResponse(
        state.currentConversation.id,
        messageId
      );

      // Update the message in the list
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id: messageId,
          updates: {
            sibling_ids: [...(state.messages.find(m => m.id === messageId)?.sibling_ids || []), response.message.id],
          },
        },
      });

      dispatch({ type: "APPEND_MESSAGE", payload: response.message });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to regenerate message" });
      console.error(err);
    } finally {
      dispatch({ type: "SET_STREAMING", payload: false });
    }
  }, [state.currentConversation, state.messages]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updated = await api.updateMessage(messageId, content);
      dispatch({ type: "APPEND_MESSAGE", payload: updated });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to edit message" });
      console.error(err);
    }
  }, []);

  const addFeedback = useCallback(async (
    messageId: string,
    type: api.FeedbackType,
    comment?: string
  ) => {
    try {
      await api.addMessageFeedback(messageId, type, comment);

      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id: messageId,
          updates: {
            feedback: {
              type,
              comment,
              created_at: new Date().toISOString(),
            },
          },
        },
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  // =============================================================================
  // FOLDER ACTIONS
  // =============================================================================

  const loadFolders = useCallback(async () => {
    try {
      const response = await api.listFolders();
      dispatch({ type: "SET_FOLDERS", payload: response.folders });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const createFolder = useCallback(async (name: string, color?: string) => {
    const folder = await api.createFolder({ name, color });
    dispatch({ type: "SET_FOLDERS", payload: [...state.folders, folder] });
    return folder;
  }, [state.folders]);

  const updateFolder = useCallback(async (folderId: string, updates: Partial<Folder>) => {
    const updated = await api.updateFolder(folderId, updates);
    const newFolders = state.folders.map((f) => (f.id === folderId ? updated : f));
    dispatch({ type: "SET_FOLDERS", payload: newFolders });
  }, [state.folders]);

  const deleteFolder = useCallback(async (folderId: string) => {
    await api.deleteFolder(folderId);
    dispatch({ type: "SET_FOLDERS", payload: state.folders.filter((f) => f.id !== folderId) });

    if (state.currentFolderId === folderId) {
      dispatch({ type: "SET_CURRENT_FOLDER", payload: null });
      loadConversations(null);
    }
  }, [state.folders, state.currentFolderId, loadConversations]);

  const selectFolder = useCallback((folderId: string | null) => {
    dispatch({ type: "SET_CURRENT_FOLDER", payload: folderId });
    loadConversations(folderId);
  }, [loadConversations]);

  // =============================================================================
  // SHARING ACTIONS
  // =============================================================================

  const shareConversation = useCallback(async (conversationId: string) => {
    const response = await api.shareConversation(conversationId);

    if (state.currentConversation?.id === conversationId) {
      dispatch({
        type: "SET_CURRENT_CONVERSATION",
        payload: {
          ...state.currentConversation,
          is_shared: true,
          share_id: response.share_id,
        },
      });
    }

    return response;
  }, [state.currentConversation]);

  const unshareConversation = useCallback(async (conversationId: string) => {
    await api.unshareConversation(conversationId);

    if (state.currentConversation?.id === conversationId) {
      dispatch({
        type: "SET_CURRENT_CONVERSATION",
        payload: {
          ...state.currentConversation,
          is_shared: false,
          share_id: undefined,
        },
      });
    }
  }, [state.currentConversation]);

  // =============================================================================
  // EXPORT ACTIONS
  // =============================================================================

  const exportConversation = useCallback(async (
    conversationId: string,
    format: api.ExportFormat
  ) => {
    const response = await api.exportConversation(conversationId, { format });
    api.downloadExport(response);
  }, []);

  // =============================================================================
  // SEARCH
  // =============================================================================

  const searchConversations = useCallback(async (query: string) => {
    return api.searchConversations({ query });
  }, []);

  // =============================================================================
  // UI ACTIONS
  // =============================================================================

  const toggleSidebar = useCallback(() => {
    const newValue = !state.sidebarCollapsed;
    dispatch({ type: "SET_SIDEBAR_COLLAPSED", payload: newValue });
    localStorage.setItem("zygotrix_ai_sidebar_collapsed", JSON.stringify(newValue));
  }, [state.sidebarCollapsed]);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: ZygotrixAIContextType = {
    state,
    loadConversations,
    loadMoreConversations,
    selectConversation,
    createNewConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    sendMessage,
    regenerateMessage,
    editMessage,
    addFeedback,
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    selectFolder,
    shareConversation,
    unshareConversation,
    exportConversation,
    searchConversations,
    toggleSidebar,
    stopStreaming,
  };

  return (
    <ZygotrixAIContext.Provider value={contextValue}>
      {children}
    </ZygotrixAIContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useZygotrixAI() {
  const context = useContext(ZygotrixAIContext);
  if (!context) {
    throw new Error("useZygotrixAI must be used within a ZygotrixAIProvider");
  }
  return context;
}
