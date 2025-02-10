'use client';

import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
    minimizedChatId: string | null;
    setMinimizedChatId: (id: string | null) => void;
    isMinimized: boolean;
    setIsMinimized: (minimized: boolean) => void;
}

const ChatContext = createContext<ChatContextType>({
    minimizedChatId: null,
    setMinimizedChatId: () => {},
    isMinimized: false,
    setIsMinimized: () => {},
});

export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [minimizedChatId, setMinimizedChatId] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    return (
        <ChatContext.Provider
            value={{
                minimizedChatId,
                setMinimizedChatId,
                isMinimized,
                setIsMinimized,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
} 