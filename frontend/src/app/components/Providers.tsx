'use client';

import { ThemeProvider } from '../context/ThemeContext';
import { ChatProvider } from '../context/ChatContext';
import MinimizedChat from './MinimizedChat';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ChatProvider>
        {children}
        <MinimizedChat />
      </ChatProvider>
    </ThemeProvider>
  );
} 