'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useThemeContext } from '../../context/ThemeContext';
import { use } from 'react';
import { useChat } from '../../context/ChatContext';
import { useRouter } from 'next/navigation';

interface Message {
    id: number;
    groupId: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
}

interface Group {
    id: number;
    groupId: string;
    destination: string;
    currentMembers: number;
    memberIds: string[];
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { setMinimizedChatId, setIsMinimized } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [group, setGroup] = useState<Group | null>(null);
    const [connectionStatus, setConnectionStatus] = useState('연결 중...');
    const [isPolling, setIsPolling] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { theme, darkMode } = useThemeContext();
    const router = useRouter();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageIdRef = useRef<number>(0);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // 폴링 설정
    useEffect(() => {
        // 토큰 확인
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            setConnectionStatus('인증 토큰 없음');
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        // 초기 그룹 정보 로드
        const loadGroupInfo = async () => {
            setConnectionStatus('그룹 정보 로드 중...');
            try {
                const response = await fetch(`/api/proxy/chat/group/${resolvedParams.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                });

                console.log('Group response status:', response.status);
                
                if (response.status === 403 || response.status === 401) {
                    const errorText = await response.text();
                    console.error('Failed to fetch group:', response.status, errorText);
                    setConnectionStatus('접근 권한 없음');
                    alert('이 채팅방에 접근할 권한이 없습니다. 다시 로그인 후 시도해주세요.');
                    localStorage.removeItem('token'); // 토큰 제거
                    router.push('/login');
                    return;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Failed to fetch group:', response.status, errorText);
                    setConnectionStatus('그룹 정보 로드 실패');
                    return;
                }

                const groupData = await response.json();
                console.log('Loaded group data:', groupData);
                setGroup(groupData);
                
                // 초기 메시지 로드
                await loadMessages();
                setConnectionStatus('연결됨');
                
                // 폴링 시작
                startPolling();
            } catch (error) {
                console.error('Error loading group info:', error);
                setConnectionStatus('연결 오류');
            }
        };

        loadGroupInfo();

        return () => {
            // 정리
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [resolvedParams.id, router]);

    // 폴링 시작 함수
    const startPolling = () => {
        if (isPolling) return;
        
        setIsPolling(true);
        console.log('Starting polling for new messages');
        
        // 3초마다 새 메시지 확인
        pollingIntervalRef.current = setInterval(async () => {
            await pollForNewMessages();
            // 10분마다 그룹 정보 업데이트 (매번 하기엔 비효율적)
            if (Date.now() % 600000 < 3000) { // 약 10분마다 한번
                await pollForGroupUpdates();
            }
        }, 3000);
    };

    // 새 메시지 폴링
    const pollForNewMessages = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // 마지막 메시지 ID 이후의 새 메시지만 가져오기
            const lastId = lastMessageIdRef.current || 0;
            const response = await fetch(`/api/proxy/chat/messages/${resolvedParams.id}?after=${lastId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
            });

            if (response.status === 403 || response.status === 401) {
                console.error('Authentication error while polling messages:', response.status);
                setConnectionStatus('인증 만료됨');
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
                return;
            }

            if (!response.ok) {
                console.error('Failed to poll messages:', response.status);
                return;
            }

            const newMessages = await response.json();
            
            if (newMessages && newMessages.length > 0) {
                console.log('Received new messages:', newMessages);
                setMessages(prev => {
                    // 중복 방지를 위해 이미 있는 메시지 필터링
                    const existingIds = new Set(prev.map(msg => msg.id));
                    const filteredNewMessages = newMessages.filter((msg: Message) => !existingIds.has(msg.id));
                    const updatedMessages = [...prev, ...filteredNewMessages];
                    
                    // 마지막 메시지 ID 업데이트
                    if (updatedMessages.length > 0) {
                        const maxId = Math.max(...updatedMessages.map((msg: Message) => msg.id));
                        lastMessageIdRef.current = maxId;
                    }
                    
                    return updatedMessages;
                });
            }
        } catch (error) {
            console.error('Error polling for messages:', error);
        }
    };

    // 그룹 정보 폴링
    const pollForGroupUpdates = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`/api/proxy/chat/group/${resolvedParams.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
            });

            if (!response.ok) {
                console.error('Failed to poll group updates:', response.status);
                return;
            }

            const updatedGroup = await response.json();
            setGroup(updatedGroup);
        } catch (error) {
            console.error('Error polling for group updates:', error);
        }
    };

    // 초기 메시지 로드
    const loadMessages = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`/api/proxy/chat/messages/${resolvedParams.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
            });

            if (response.status === 403 || response.status === 401) {
                const errorText = await response.text();
                console.error('Authentication error loading messages:', response.status, errorText);
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to load messages:', response.status, errorText);
                return;
            }

            const loadedMessages = await response.json();
            console.log('Loaded messages:', loadedMessages);
            
            if (loadedMessages && loadedMessages.length > 0) {
                setMessages(loadedMessages);
                // 마지막 메시지 ID 설정
                const maxId = Math.max(...loadedMessages.map(msg => msg.id));
                lastMessageIdRef.current = maxId;
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        
        setConnectionStatus('메시지 전송 중...');
        
        try {
            const messageContent = newMessage.trim();
            setNewMessage(''); // 즉시 입력창 비우기
            
            // 메시지 객체 생성 (ID는 서버에서 생성)
            const message = {
                groupId: resolvedParams.id,
                content: messageContent,
                timestamp: new Date().toISOString()
            };

            // REST API로 메시지 전송 (프록시 사용)
            console.log('Sending message via REST API:', message);
            const response = await fetch('/api/proxy/chat/message/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(message)
            });
            
            console.log('Send message response status:', response.status);
            
            if (response.ok) {
                console.log('Message sent successfully via REST');
                // 새 메시지를 바로 가져오기 위해 폴링 실행
                await pollForNewMessages();
                setConnectionStatus('연결됨');
            } else {
                console.error('Failed to send message:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                
                if (response.status === 403 || response.status === 401) {
                    alert('메시지 전송 권한이 없습니다. 다시 로그인해주세요.');
                    localStorage.removeItem('token');
                    router.push('/login');
                } else {
                    alert('메시지 전송에 실패했습니다. 나중에 다시 시도해주세요.');
                }
                setConnectionStatus('전송 실패');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('메시지 전송에 실패했습니다. 인터넷 연결을 확인해주세요.');
            setConnectionStatus('연결 오류');
        }
    };

    // Automatically minimize chat when navigating away
    useEffect(() => {
        const handleRouteChange = () => {
            setMinimizedChatId(resolvedParams.id);
            setIsMinimized(true);
        };

        window.addEventListener('popstate', handleRouteChange);
        
        // Cleanup
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [resolvedParams.id, setMinimizedChatId, setIsMinimized]);

    const handleMinimize = () => {
        setMinimizedChatId(resolvedParams.id);
        setIsMinimized(true);
        router.push('/');
    };

    // Ensure dark mode and direction are applied
    useEffect(() => {
        document.body.className = `${theme} ${darkMode ? 'darkMode' : ''}`;
    }, [theme, darkMode]);

    return (
        <div className={`${theme} ${darkMode ? 'darkMode' : ''}`}>
            <Header />
            <main className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h2>#{resolvedParams.id}</h2>
                        <span className={styles.memberCount}>
                            {group?.currentMembers || 0}명
                        </span>
                    </div>
                    <div className={styles.connectionStatus} title={connectionStatus}>
                        <span className={`${styles.statusDot} ${connectionStatus === '연결됨' ? styles.connected : styles.disconnected}`}></span>
                        {connectionStatus === '연결됨' ? '온라인' : '연결 중...'}
                    </div>
                    <button onClick={handleMinimize} className={styles.minimizeButton}>
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            className={styles.minimizeIcon}
                        >
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm3 10.5a.75.75 0 000-1.5H9a.75.75 0 000 1.5h6z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className={styles.messageContainer}>
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id || index}
                            className={`${styles.message} ${
                                msg.senderId === localStorage.getItem('token')
                                    ? styles.sent
                                    : styles.received
                            }`}
                        >
                            <div className={styles.messageHeader}>
                                <span className={styles.sender}>{msg.senderName}</span>
                                <span className={styles.time}>
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className={styles.messageContent}>{msg.content}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="메시지를 입력하세요..."
                        className={styles.input}
                    />
                    <button 
                        onClick={handleSend} 
                        className={styles.sendButton}
                    >
                        전송
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
} 