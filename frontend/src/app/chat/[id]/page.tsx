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
        const maxReconnectAttempts = 10;

        const initializeWebSocket = () => {
            try {
                // 백엔드 서버로 직접 연결
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
                const wsUrl = `${backendUrl}/ws`;
                console.log('직접 백엔드 WebSocket에 연결합니다:', wsUrl);
                
                // 인증 토큰 가져오기
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    console.error('인증 토큰이 없습니다. WebSocket 연결을 시도할 수 없습니다.');
                    setConnectionStatus('인증 오류: 로그인이 필요합니다');
                    return;
                }

                // STOMP 클라이언트 생성
                client = new Client({
                    webSocketFactory: () => {
                        try {
                            // SockJS 설정 - 폴백 메커니즘 간소화
                            const socket = new SockJS(wsUrl, null, {
                                transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
                                timeout: 15000,
                            });
                            
                            // 개발 및 디버깅용 로그
                            const originalOnOpen = socket.onopen;
                            socket.onopen = function(event) {
                                console.log('SockJS 연결 성공!');
                                if (originalOnOpen) originalOnOpen.call(this, event);
                            };
                            
                            const originalOnClose = socket.onclose;
                            socket.onclose = function(event) {
                                console.log('SockJS 연결 종료:', event);
                                if (originalOnClose) originalOnClose.call(this, event);
                            };
                            
                            const originalOnError = socket.onerror;
                            socket.onerror = function(event) {
                                console.error('SockJS 오류 발생:', event);
                                if (originalOnError) originalOnError.call(this, event);
                            };
                            
                            console.log('SockJS 인스턴스 생성됨:', socket);
                            return socket;
                        } catch (error) {
                            console.error('SockJS 인스턴스 생성 실패:', error);
                            setConnectionStatus('연결 실패: SockJS 인스턴스 생성 오류');
                            return null;
                        }
                    },
                    // 인증 토큰을 헤더에 추가
                    connectHeaders: {
                        Authorization: `Bearer ${token}`
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 10000,
                    heartbeatOutgoing: 10000,
                    debug: function(str) {
                        console.log('STOMP 디버그:', str);
                    }
                });

                // 연결 이벤트 핸들러
                client.onConnect = (frame) => {
                    console.log('STOMP 연결 성공!', frame);
                    setConnectionStatus('연결됨');
                    reconnectAttempts = 0;
                    
                    // 채팅방 구독
                    client?.subscribe(`/topic/chat/${resolvedParams.id}`, (message) => {
                        try {
                            const newMsg = JSON.parse(message.body);
                            console.log('메시지 수신:', newMsg);
                            setMessages(prev => [...prev, newMsg]);
                            scrollToBottom();
                        } catch (error) {
                            console.error('메시지 파싱 오류:', error, message.body);
                        }
                    });
                    
                    // 그룹 정보 구독
                    client?.subscribe(`/topic/group/${resolvedParams.id}`, (message) => {
                        try {
                            const groupInfo = JSON.parse(message.body);
                            console.log('그룹 정보 업데이트:', groupInfo);
                            setGroup(groupInfo);
                        } catch (error) {
                            console.error('그룹 정보 파싱 오류:', error, message.body);
                        }
                    });
                };

                // 오류 처리 및 재연결
                client.onStompError = (frame) => {
                    console.error('STOMP 오류:', frame);
                    setConnectionStatus('연결 오류: ' + frame.headers.message);
                };

                client.onWebSocketClose = (event) => {
                    console.log('WebSocket 연결 종료:', event);
                    setConnectionStatus('연결 종료: 재연결 중...');
                    
                    // 재연결 시도
                    if (reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        console.log(`재연결 시도 #${reconnectAttempts}`);
                        setTimeout(() => {
                            if (client) {
                                client.deactivate();
                                client.activate();
                            }
                        }, 5000);
                    } else {
                        console.error('최대 재연결 횟수 초과');
                        setConnectionStatus('연결 실패: 최대 재시도 횟수 초과');
                    }
                };

                // 연결 활성화
                client.activate();
                setStompClient(client);
            } catch (error) {
                console.error('WebSocket 초기화 오류:', error);
                setConnectionStatus('연결 실패');
            }
        };

        // 초기 데이터 불러오기
        const fetchData = async () => {
            try {
                // 토큰 가져오기
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    console.error('인증 토큰이 없습니다. API 요청을 할 수 없습니다.');
                    return;
                }
                
                // 백엔드 URL 설정
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
                
                // 그룹 정보 가져오기
                console.log('그룹 정보 가져오기...');
                const groupResponse = await fetch(`${backendUrl}/api/taxi/group/${resolvedParams.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!groupResponse.ok) {
                    console.error('그룹 정보 가져오기 실패:', groupResponse.status);
                    return;
                }
                
                const groupData = await groupResponse.json();
                console.log('그룹 정보:', groupData);
                setGroup(groupData);
                
                // 채팅 메시지 가져오기
                console.log('채팅 메시지 가져오기...');
                const messagesResponse = await fetch(`${backendUrl}/api/taxi/chat/${resolvedParams.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!messagesResponse.ok) {
                    console.error('채팅 메시지 가져오기 실패:', messagesResponse.status);
                    return;
                }
                
                const messagesData = await messagesResponse.json();
                console.log('채팅 메시지:', messagesData);
                setMessages(messagesData);
                
                setTimeout(scrollToBottom, 100);
            } catch (error) {
                console.error('데이터 가져오기 오류:', error);
            }
        };

        fetchData();
        initializeWebSocket();

        return () => {
            if (client) {
                console.log('WebSocket 연결 정리');
                client.deactivate();
                setStompClient(null);
            }
        };
    }, [resolvedParams.id, router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim() === '') return;
        
        try {
            if (!stompClient || !stompClient.connected) {
                console.error('STOMP 클라이언트가 연결되지 않았습니다.');
                setConnectionStatus('연결되지 않음 - 재연결 중...');
                return;
            }
            
            const token = localStorage.getItem('accessToken');
            if (!token) {
                console.error('인증 토큰이 없습니다.');
                return;
            }
            
            // 메시지 객체 생성
            const message = {
                groupId: resolvedParams.id,
                content: newMessage.trim()
            };
            
            console.log('메시지 전송 중:', message);
            
            // STOMP를 통해 메시지 전송
            stompClient.publish({
                destination: `/app/chat/${resolvedParams.id}`,
                body: JSON.stringify(message),
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // 메시지 입력 필드 초기화
            setNewMessage('');
        } catch (error) {
            console.error('메시지 전송 오류:', error);
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

    // 라우트 변경 시 연결 정리
    useEffect(() => {
        const handleRouteChange = () => {
            console.log('페이지 이동 감지: WebSocket 연결 정리');
            if (stompClient) {
                try {
                    stompClient.deactivate();
                    setStompClient(null);
                    setConnectionStatus('연결 종료');
                } catch (error) {
                    console.error('라우트 변경 시 WebSocket 정리 오류:', error);
                }
            }
        };

        // 브라우저의 앞으로/뒤로 버튼 이벤트 처리
        window.addEventListener('popstate', handleRouteChange);
        
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [stompClient]);

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