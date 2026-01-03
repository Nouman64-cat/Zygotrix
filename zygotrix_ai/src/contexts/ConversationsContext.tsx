import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { chatService } from '../services';
import type { LocalConversation } from '../types';
import { useAuth } from './AuthContext';

interface ConversationsContextType {
    conversations: LocalConversation[];
    loading: boolean;
    error: string | null;
    refreshConversations: () => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    renameConversation: (id: string, newTitle: string) => Promise<void>;
    pinConversation: (id: string, isPinned: boolean) => Promise<void>;
    addConversation: (conversation: LocalConversation) => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export const ConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    // Initialize from cache
    const [conversationsList, setConversationsList] = useState<LocalConversation[]>(() => {
        try {
            const cached = localStorage.getItem('zygotrix_conversations');
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            console.warn('Failed to parse cached conversations', e);
            return [];
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Persist to cache on change
    useEffect(() => {
        if (conversationsList.length > 0) {
            localStorage.setItem('zygotrix_conversations', JSON.stringify(conversationsList));
        }
    }, [conversationsList]);

    const loadConversations = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
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
        } catch (err) {
            console.error('Failed to load conversations:', err);
            setError('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        if (user) {
            loadConversations();
        } else {
            setConversationsList([]);
        }
    }, [user, loadConversations]);

    const deleteConversation = useCallback(async (id: string) => {
        try {
            // Optimistic update
            setConversationsList(prev => prev.filter(c => c.id !== id));
            await chatService.deleteConversation(id);
        } catch (err) {
            console.error('Failed to delete conversation:', err);
            loadConversations(); // Revert
            throw err;
        }
    }, [loadConversations]);

    const renameConversation = useCallback(async (id: string, newTitle: string) => {
        try {
            setConversationsList(prev => prev.map(c =>
                c.id === id ? { ...c, title: newTitle } : c
            ));
            await chatService.updateConversation(id, { title: newTitle });
        } catch (err) {
            console.error('Failed to rename conversation:', err);
            loadConversations();
            throw err;
        }
    }, [loadConversations]);

    const pinConversation = useCallback(async (id: string, isPinned: boolean) => {
        try {
            setConversationsList(prev => prev.map(c =>
                c.id === id ? { ...c, isPinned } : c
            ));
            await chatService.updateConversation(id, { is_pinned: isPinned });
        } catch (err) {
            console.error('Failed to pin conversation:', err);
            loadConversations();
            throw err;
        }
    }, [loadConversations]);

    // Helper to manually add a new conversation (e.g., when created in Chat)
    const addConversation = useCallback((conversation: LocalConversation) => {
        setConversationsList(prev => {
            // Prevent duplicates
            if (prev.some(c => c.id === conversation.id)) return prev;
            return [conversation, ...prev];
        });
    }, []);

    // Sorted list for consumers
    const sortedConversations = useMemo(() => {
        return [...conversationsList].sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return b.updatedAt - a.updatedAt;
        });
    }, [conversationsList]);

    return (
        <ConversationsContext.Provider
            value={{
                conversations: sortedConversations,
                loading,
                error,
                refreshConversations: loadConversations,
                deleteConversation,
                renameConversation,
                pinConversation,
                addConversation
            }}
        >
            {children}
        </ConversationsContext.Provider>
    );
};

export const useConversations = () => {
    const context = useContext(ConversationsContext);
    if (context === undefined) {
        throw new Error('useConversations must be used within a ConversationsProvider');
    }
    return context;
};
