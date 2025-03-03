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
                // 웹소켓을 백엔드 서버로 직접 연결
                const backendUrl = 'http://3.27.108.105:8080';
                const wsUrl = `${backendUrl}/ws`;
                console.log('Connecting to chat WebSocket at:', wsUrl);
                
                client = new Client({
                    webSocketFactory: () => {
                        try {
                            return new SockJS(wsUrl);
                        } catch (error) {
                            console.error('SockJS connection error:', error);
                            setConnectionStatus('웹소켓 연결 실패');
                            return null;
                        }
                    },
                    connectHeaders: {
                        // 인증 토큰을 헤더에 추가
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
            try {
                // 그룹 정보 가져오기
                const groupResponse = await fetch(`/api/proxy/chat/group/${resolvedParams.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                
                if (!groupResponse.ok) {
                    console.error('Failed to fetch group');
                    setConnectionStatus('그룹 정보를 가져오는데 실패했습니다');
                    return;
                }
                
                const groupData = await groupResponse.json();
                setGroup(groupData);
                
                // 채팅 내역 가져오기
                const messagesResponse = await fetch(`/api/proxy/chat/messages/${resolvedParams.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                
                if (!messagesResponse.ok) {
                    console.error('Failed to fetch messages');
                    setConnectionStatus('채팅 내역을 가져오는데 실패했습니다');
                    return;
                }
                
                const messagesData = await messagesResponse.json();
                setMessages(messagesData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setConnectionStatus('데이터를 가져오는데 실패했습니다');
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

    const handleSend = () => {
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
                stompClient.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify(message)
                });
                
                setNewMessage('');
            } else {
                console.error('STOMP client is not connected');
                alert('웹소켓 연결이 끊어졌습니다. 새로고침 후 다시 시도해주세요.');
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