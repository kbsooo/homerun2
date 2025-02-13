'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from './page.module.css';
import { ChatHistory, ChatMessage } from '../api/chat/route';

export default function MyPage() {
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 다크모드 상태 불러오기
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    // 채팅 히스토리 가져오기
    fetchChatHistories();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchChatMessages(selectedChat);
    }
  }, [selectedChat]);

  const handleToggleDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    localStorage.setItem('darkMode', value.toString());
  };

  const fetchChatHistories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('Fetching chat histories...');
      const response = await fetch('/api/chat/histories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response received:', response.status);
      const text = await response.text();
      console.log('Raw response:', text);

      if (!text) {
        throw new Error('서버에서 응답을 받지 못했습니다.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('서버 응답을 처리하는데 실패했습니다.');
      }

      if (!response.ok) {
        throw new Error(data.error || '채팅 기록을 불러오는데 실패했습니다.');
      }

      console.log('Chat histories:', data);
      setChatHistories(data);
    } catch (error) {
      console.error('Failed to fetch chat histories:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('Fetching chat messages for room:', chatId);
      const response = await fetch(`/api/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response received:', response.status);
      const text = await response.text();
      console.log('Raw response:', text);

      if (!text) {
        throw new Error('서버에서 응답을 받지 못했습니다.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('서버 응답을 처리하는데 실패했습니다.');
      }

      if (!response.ok) {
        throw new Error(data.error || '메시지를 불러오는데 실패했습니다.');
      }

      console.log('Chat messages:', data);
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.pageContainer} ${isDarkMode ? 'darkMode' : ''}`}>
      <Header isDarkMode={isDarkMode} onToggleDarkMode={handleToggleDarkMode} />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>나의 채팅 기록</h1>
          
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className={styles.retryButton}>
                다시 시도
              </button>
            </div>
          )}
          
          <div className={styles.content}>
            <div className={styles.historyList}>
              {isLoading ? (
                <div className={styles.loading}>
                  <p>로딩 중...</p>
                </div>
              ) : chatHistories.length > 0 ? (
                chatHistories.map((history) => (
                  <div
                    key={history.id}
                    className={`${styles.historyItem} ${selectedChat === history.id ? styles.selected : ''}`}
                    onClick={() => setSelectedChat(history.id)}
                  >
                    <div className={styles.historyHeader}>
                      <span className={styles.date}>{history.date}</span>
                      <span className={styles.roomId}>#{history.roomId}</span>
                    </div>
                    <p className={styles.lastMessage}>{history.lastMessage}</p>
                    <div className={styles.participants}>
                      참여자 {history.participants}명
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>아직 참여한 채팅방이 없습니다.</p>
                </div>
              )}
            </div>

            {selectedChat ? (
              <div className={styles.messageList}>
                {isLoading ? (
                  <div className={styles.loading}>
                    <p>로딩 중...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className={styles.messageItem}>
                      <div className={styles.messageHeader}>
                        <span className={styles.sender}>{message.sender}</span>
                        <span className={styles.time}>{message.time}</span>
                      </div>
                      <p className={styles.messageContent}>{message.content}</p>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <p>메시지가 없습니다.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.messageList}>
                <div className={styles.emptyState}>
                  <p>채팅방을 선택해주세요.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 