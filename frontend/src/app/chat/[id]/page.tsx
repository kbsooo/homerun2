'use client';

import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import styles from './page.module.css';
import SockJS from 'sockjs-client';
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
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [connectionStatus, setConnectionStatus] = useState('연결 중...');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // const { theme, darkMode, toggleDarkMode } = useThemeContext();
    const { theme, darkMode } = useThemeContext();
    const router = useRouter();

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // 웹소켓 연결 설정
    useEffect(() => {
        let client: Client | null = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        const initializeWebSocket = () => {
            try {
                // 토큰 확인
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No auth token found');
                    setConnectionStatus('인증 토큰 없음');
                    router.push('/');
                    return;
                }

                // 웹소켓 연결 경로 설정 (API 프록시를 통해 연결)
                const wsUrl = `/api/proxy/ws`;
                console.log('Connecting to chat WebSocket at:', wsUrl);
                
                // STOMP 클라이언트 설정
                client = new Client({
                    webSocketFactory: () => {
                        try {
                            // SockJS 옵션 설정
                            const sockjs = new SockJS(wsUrl, null, {
                                transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
                                timeout: 10000
                            });

                            // 디버깅을 위한 이벤트 리스너 추가
                            sockjs.onopen = () => console.log('SockJS connection opened');
                            sockjs.onclose = (e) => console.log('SockJS connection closed', e);
                            sockjs.onerror = (e) => console.error('SockJS error', e);

                            return sockjs;
                        } catch (error) {
                            console.error('SockJS connection error:', error);
                            setConnectionStatus('웹소켓 연결 실패');
                            return null;
                        }
                    },
                    connectHeaders: {
                        Authorization: `Bearer ${token}` 
                    },
                    reconnectDelay: 5000, // 5초 후 재연결
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                    onConnect: () => {
                        console.log('Connected to chat WebSocket');
                        setConnectionStatus('연결됨');
                        reconnectAttempts = 0;
                        
                        // 구독
                        client?.subscribe(`/topic/chat/${resolvedParams.id}`, (message) => {
                            const newMsg = JSON.parse(message.body);
                            setMessages(prev => [...prev, newMsg]);
                        });
                        
                        client?.subscribe(`/topic/group/${resolvedParams.id}`, (message) => {
                            const updatedGroup = JSON.parse(message.body);
                            setGroup(updatedGroup);
                        });
                    },
                    onStompError: (frame) => {
                        console.error('STOMP error:', frame);
                        setConnectionStatus('STOMP 오류');
                    },
                    onWebSocketError: (error) => {
                        console.error('WebSocket error:', error);
                        setConnectionStatus('웹소켓 오류');
                        
                        reconnectAttempts++;
                        if (reconnectAttempts > maxReconnectAttempts) {
                            console.log('최대 재연결 시도 횟수 초과');
                            setConnectionStatus('연결 실패 - 새로고침 필요');
                        }
                    },
                    onWebSocketClose: () => {
                        console.log('WebSocket connection closed');
                        setConnectionStatus('연결 끊김');
                    },
                    debug: (str) => {
                        console.log('STOMP debug:', str);
                    }
                });

                try {
                    client.activate();
                    setStompClient(client);
                } catch (error) {
                    console.error('Failed to activate STOMP client:', error);
                    setConnectionStatus('STOMP 활성화 실패');
                }
            } catch (error) {
                console.error('Error initializing WebSocket:', error);
                setConnectionStatus('웹소켓 초기화 오류');
            }
        };

        // 초기 데이터 불러오기
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            try {
                // API 통신 전에 인증 토큰 상태 출력 (디버깅용)
                console.log('Using auth token for API requests:', token.substring(0, 10) + '...');
                
                // 그룹 정보 가져오기 (프록시 사용)
                console.log(`Fetching group info for ${resolvedParams.id}`);
                const groupResponse = await fetch(`/api/proxy/chat/group/${resolvedParams.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });

                console.log('Group response status:', groupResponse.status);
                
                if (groupResponse.ok) {
                    const groupData = await groupResponse.json();
                    console.log('Group data received:', groupData);
                    setGroup(groupData);
                } else {
                    console.error('Failed to fetch group:', groupResponse.status);
                    // 오류 응답 내용 로깅 시도
                    try {
                        const errorText = await groupResponse.text();
                        console.error('Error response:', errorText);
                    } catch {
                        console.error('Could not read error response');
                    }
                    
                    if (groupResponse.status === 403 || groupResponse.status === 401) {
                        alert('이 채팅방에 접근할 권한이 없습니다.');
                        router.push('/');
                    }
                }

                // 메시지 정보 가져오기 (프록시 사용)
                const messagesResponse = await fetch(`/api/proxy/chat/messages/${resolvedParams.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });

                if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    setMessages(messagesData);
                } else {
                    console.error('Failed to fetch messages:', messagesResponse.status);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        initializeWebSocket();

        return () => {
            if (client?.active) {
                try {
                    client.deactivate();
                } catch (error) {
                    console.error('Error deactivating STOMP client:', error);
                }
            }
        };
    }, [resolvedParams.id, router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        if (!stompClient || !stompClient.active) {
            console.error('STOMP client is not connected');
            alert('메시지 전송을 위한 웹소켓 연결이 활성화되지 않았습니다. 새로고침 후 다시 시도해주세요.');
            return;
        }

        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('userInfo');

        if (!token || !userInfo) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const { nickname } = JSON.parse(userInfo);
            const message = {
                groupId: resolvedParams.id,
                senderId: token,
                senderName: nickname,
                content: newMessage,
                timestamp: new Date().toISOString()
            };

            // 웹소켓 연결 상태 확인
            if (stompClient.connected) {
                console.log('Sending message via WebSocket:', message);
                stompClient.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify(message),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    }
                });
                setNewMessage('');
            } else {
                console.error('STOMP client is not connected, attempting REST fallback');
                
                // 연결이 끊긴 경우 REST API로 전송 시도 (프록시 사용)
                try {
                    console.log('Sending message via REST API');
                    const response = await fetch('/api/proxy/chat/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(message)
                    });
                    
                    console.log('REST message response status:', response.status);
                    if (response.ok) {
                        setNewMessage('');
                        // REST API로 메시지를 보낸 후에도 로컬 상태 업데이트
                        setMessages(prev => [...prev, {
                            ...message,
                            id: Date.now() // 임시 ID 생성
                        }]);
                    } else {
                        const errorText = await response.text();
                        console.error('REST message error:', errorText);
                        alert('메시지 전송에 실패했습니다. 네트워크 연결을 확인해주세요.');
                    }
                } catch (error) {
                    console.error('Error sending message via REST:', error);
                    alert('메시지 전송에 실패했습니다. 인터넷 연결을 확인해주세요.');
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('메시지 전송에 실패했습니다.');
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
                        disabled={!stompClient?.connected}
                    />
                    <button 
                        onClick={handleSend} 
                        className={styles.sendButton}
                        disabled={!stompClient?.connected}
                    >
                        전송
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
} 