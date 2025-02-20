'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from './page.module.css';
import { ChatHistory, ChatMessage } from '../api/chat/route';
import { useThemeContext } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyPage() {
  const router = useRouter();
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const { theme, darkMode } = useThemeContext();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (!token || !userInfo) {
      router.push('/');
      return;
    }

    fetchChatHistories();
  }, [router]);

  useEffect(() => {
    if (selectedChat) {
      fetchChatMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    document.body.className = `${theme} ${darkMode ? 'darkMode' : ''}`;
  }, [theme, darkMode]);

  const fetchChatHistories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      if (!token || !userInfo) {
        router.push('/');
        return;
      }

      console.log('Original token:', token);
      console.log('UserInfo:', userInfo);

      if (!token.startsWith('Bearer ')) {
        token = `Bearer ${token}`;
      }

      console.log('Final token being sent:', token);

      const response = await fetch('http://localhost:8080/api/chat/histories', {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log('Response headers:', responseHeaders);

      let data;
      try {
        const text = await response.text();
        console.log('Raw response text:', text);
        
        if (!text) {
          console.log('Empty response received');
          if (response.status === 403) {
            throw new Error('로그인이 필요합니다.');
          }
          throw new Error('서버 응답이 비어있습니다.');
        }
        
        try {
          data = JSON.parse(text);
          console.log('Parsed data:', data);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          if (response.status === 403) {
            throw new Error('로그인이 필요합니다.');
          }
          throw new Error('서버 응답을 처리하는데 실패했습니다.');
        }

        if (!response.ok) {
          if (response.status === 403 && data?.error) {
            console.log('403 error data:', data);
            if (data.error === '로그인이 만료되었습니다.' || 
                data.error === '유효하지 않은 인증입니다.' || 
                data.error === '로그인이 필요합니다.') {
              console.log('Token invalid or expired, redirecting to home');
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
              router.push('/');
              return;
            }
            throw new Error(data.error);
          }
          throw new Error(data?.error || '채팅 기록을 불러오는데 실패했습니다.');
        }

        if (!Array.isArray(data)) {
          throw new Error('잘못된 응답 형식입니다.');
        }

        setChatHistories(data);
      } catch (error) {
        console.error('Failed to fetch chat histories:', error);
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch chat histories:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    try {
      setIsMessagesLoading(true);
      setMessagesError(null);
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      if (!token || !userInfo) {
        router.push('/');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        credentials: 'include'
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('서버 응답을 처리하는데 실패했습니다.');
      }

      if (!response.ok) {
        if (response.status === 403) {
          if (data?.error === '로그인이 만료되었습니다.' || data?.error === '유효하지 않은 인증입니다.') {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            router.push('/');
            return;
          }
        }
        throw new Error(data?.error || '메시지를 불러오는데 실패했습니다.');
      }

      if (!Array.isArray(data)) {
        throw new Error('잘못된 응답 형식입니다.');
      }

      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      setMessagesError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const handleRetry = () => {
    if (selectedChat) {
      fetchChatMessages(selectedChat);
    } else {
      fetchChatHistories();
    }
  };

  return (
    <div className={`${styles.pageContainer} ${darkMode ? styles.darkMode : ''}`}>
      <Header />
      <main className={`${styles.main} ${darkMode ? styles.darkMode : ''}`}>
        <div className={`${styles.container} ${darkMode ? styles.darkMode : ''}`}>
          <h1 className={`${styles.title} ${darkMode ? styles.darkMode : ''}`}>나의 채팅 기록</h1>
          
          {error && (
            <div className={`${styles.error} ${darkMode ? styles.darkMode : ''}`}>
              <p>{error}</p>
              <button onClick={handleRetry} className={`${styles.retryButton} ${darkMode ? styles.darkMode : ''}`}>
                다시 시도
              </button>
            </div>
          )}
          
          <div className={`${styles.content} ${darkMode ? styles.darkMode : ''}`}>
            <div className={`${styles.historyList} ${darkMode ? styles.darkMode : ''}`}>
              {isLoading ? (
                <div className={`${styles.loading} ${darkMode ? styles.darkMode : ''}`}>
                  <LoadingSpinner />
                </div>
              ) : chatHistories.length > 0 ? (
                chatHistories.map((history) => (
                  <div
                    key={history.id}
                    className={`${styles.historyItem} ${selectedChat === history.id ? styles.selected : ''} ${darkMode ? styles.darkMode : ''}`}
                    onClick={() => setSelectedChat(history.id)}
                  >
                    <div className={styles.historyHeader}>
                      <span className={`${styles.date} ${darkMode ? styles.darkMode : ''}`}>{history.date}</span>
                      <span className={`${styles.roomId} ${darkMode ? styles.darkMode : ''}`}>#{history.roomId}</span>
                    </div>
                    <p className={`${styles.lastMessage} ${darkMode ? styles.darkMode : ''}`}>{history.lastMessage}</p>
                    <div className={`${styles.participants} ${darkMode ? styles.darkMode : ''}`}>
                      참여자 {history.participants}명
                    </div>
                  </div>
                ))
              ) : (
                <div className={`${styles.emptyState} ${darkMode ? styles.darkMode : ''}`}>
                  <p>아직 참여한 채팅방이 없습니다.</p>
                </div>
              )}
            </div>

            <div className={`${styles.messageList} ${darkMode ? styles.darkMode : ''}`}>
              {selectedChat ? (
                <>
                  {messagesError && (
                    <div className={`${styles.error} ${darkMode ? styles.darkMode : ''}`}>
                      <p>{messagesError}</p>
                      <button onClick={handleRetry} className={`${styles.retryButton} ${darkMode ? styles.darkMode : ''}`}>
                        다시 시도
                      </button>
                    </div>
                  )}
                  
                  {isMessagesLoading ? (
                    <div className={`${styles.loading} ${darkMode ? styles.darkMode : ''}`}>
                      <LoadingSpinner />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div key={message.id} className={`${styles.messageItem} ${darkMode ? styles.darkMode : ''}`}>
                        <div className={styles.messageHeader}>
                          <span className={`${styles.sender} ${darkMode ? styles.darkMode : ''}`}>{message.sender}</span>
                          <span className={`${styles.time} ${darkMode ? styles.darkMode : ''}`}>{message.time}</span>
                        </div>
                        <p className={`${styles.messageContent} ${darkMode ? styles.darkMode : ''}`}>{message.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className={`${styles.emptyState} ${darkMode ? styles.darkMode : ''}`}>
                      <p>메시지가 없습니다.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className={`${styles.emptyState} ${darkMode ? styles.darkMode : ''}`}>
                  <p>채팅방을 선택해주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 