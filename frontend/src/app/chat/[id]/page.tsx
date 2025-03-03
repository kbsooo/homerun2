'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import styles from './page.module.css';
import SockJS from 'sockjs-client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useThemeContext } from '../../context/ThemeContext';
import { use } from 'react';
import { useChat } from '../../context/ChatContext';
import { useRouter } from 'next/navigation';
// Stomp 타입 정의가 없을 경우 any 타입으로 처리
// @ts-ignore
import Stomp from 'stompjs';

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

    // WebSocket 연결 설정
    const connectWebSocket = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found for WebSocket connection');
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        console.log('Setting up WebSocket with token:', token.substring(0, 10) + '...');
        console.log('WebSocket connecting to /api/proxy/ws');

        try {
            // 재시도 카운터 초기화
            let reconnectAttempt = 0;
            const MAX_RECONNECT_ATTEMPTS = 5;

            // SockJS를 사용한 WebSocket 연결
            const socket = new SockJS('/api/proxy/ws');
            
            // WebSocket 연결 이벤트 로깅
            socket.onopen = () => {
                console.log('WebSocket connection opened successfully');
                setConnectionStatus('connected');
            };
            
            socket.onclose = (event: CloseEvent) => {
                console.log('WebSocket connection closed', event);
                setConnectionStatus('disconnected');
                
                // 재연결 시도 (최대 5번)
                if (reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempt++;
                    console.log(`Reconnect attempt ${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS}`);
                    setTimeout(connectWebSocket, 2000);
                } else {
                    console.error('Max reconnect attempts reached');
                    alert('채팅 서버와 연결이 끊겼습니다. 페이지를 새로고침해주세요.');
                }
            };
            
            socket.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
            };
            
            // STOMP 클라이언트 설정
            const stompClient = Stomp.over(socket);
            
            // STOMP 디버그 로그 활성화 (개발 중 문제 해결용)
            stompClient.debug = (message: string) => console.log('STOMP:', message);
            
            // 헤더에 Authorization 추가하여 연결
            stompClient.connect(
                { 
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }, 
                () => {
                    console.log('STOMP connected successfully');
                    
                    // 채팅 메시지 구독
                    console.log(`Subscribing to /topic/chat/${resolvedParams.id}`);
                    const chatSubscriptionHeaders = {'Authorization': `Bearer ${token}`};
                    
                    stompClient.subscribe(
                        `/topic/chat/${resolvedParams.id}`, 
                        (messageOutput: any) => {
                            try {
                                console.log('Received message from chat subscription:', messageOutput);
                                const message = JSON.parse(messageOutput.body);
                                console.log('Parsed message:', message);
                                setMessages((prevMessages) => [...prevMessages, message]);
                            } catch (error) {
                                console.error('Error processing message:', error);
                            }
                        },
                        chatSubscriptionHeaders
                    );
                    
                    // 그룹 업데이트 구독
                    console.log(`Subscribing to /topic/group/${resolvedParams.id}`);
                    const groupSubscriptionHeaders = {'Authorization': `Bearer ${token}`};
                    
                    stompClient.subscribe(
                        `/topic/group/${resolvedParams.id}`, 
                        (groupOutput: any) => {
                            try {
                                console.log('Received update from group subscription:', groupOutput);
                                const groupUpdate = JSON.parse(groupOutput.body);
                                console.log('Parsed group update:', groupUpdate);
                                setGroup(groupUpdate);
                            } catch (error) {
                                console.error('Error processing group update:', error);
                            }
                        },
                        groupSubscriptionHeaders
                    );
                },
                (error: unknown) => {
                    console.error('STOMP connection error:', error);
                    setConnectionStatus('error');
                    alert('채팅 서버 연결 중 오류가 발생했습니다.');
                }
            );
            
            setStompClient(stompClient);
        } catch (error) {
            console.error('Error setting up WebSocket:', error);
            setConnectionStatus('error');
            alert('채팅 연결 설정 중 오류가 발생했습니다.');
        }
    };

    // 초기 데이터 불러오기
    const fetchData = async () => {
        // 토큰 확인 및 디버깅
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found in localStorage');
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        // 토큰 디버깅을 위한 로그 추가
        console.log('Token from localStorage:', token.substring(0, 20) + '...');
        console.log('Group ID:', resolvedParams.id);

        try {
            // API 통신 전에 인증 토큰 상태 출력 (디버깅용)
            console.log('Using auth token for API requests:', token.substring(0, 10) + '...');
            
            // 인증 헤더 생성
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            // 1. 먼저 Backend에 직접 API 호출을 시도 (디버깅 목적)
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
                console.log(`Trying direct backend connection to: ${backendUrl}/api/chat/group/${resolvedParams.id}`);
                
                // 직접 호출은 CORS 오류가 발생할 수 있으므로 프록시를 우선 사용
            } catch (directError) {
                console.log('Direct connection test error (expected):', directError);
            }
            
            // 2. 프록시를 통한 실제 API 호출
            console.log(`Fetching group info for ${resolvedParams.id} via proxy`);
            const groupResponse = await fetch(`/api/proxy/chat/group/${resolvedParams.id}`, {
                method: 'GET',
                headers,
                credentials: 'include',
                cache: 'no-store'
            });

            console.log('Group response status:', groupResponse.status);
            
            if (groupResponse.ok) {
                const responseText = await groupResponse.text();
                console.log('Group data raw response:', responseText);
                
                try {
                    const groupData = JSON.parse(responseText);
                    console.log('Parsed group data:', groupData);
                    setGroup(groupData);
                } catch (parseError) {
                    console.error('Failed to parse group data JSON:', parseError);
                    alert('그룹 데이터를 처리하는 중 오류가 발생했습니다.');
                    router.push('/');
                    return;
                }
            } else {
                console.error('Failed to fetch group:', groupResponse.status);
                // 오류 응답 내용 로깅 시도
                try {
                    const errorText = await groupResponse.text();
                    console.error('Error response:', errorText);
                    
                    // 세션 만료 가능성 확인
                    if (errorText.includes('expired') || errorText.includes('invalid') || 
                        errorText.includes('unauthorized') || errorText.includes('권한') ||
                        groupResponse.status === 403 || groupResponse.status === 401) {
                        
                        // 토큰 관련 문제로 보임
                        alert('인증이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                        localStorage.removeItem('token'); // 만료된 토큰 삭제
                        router.push('/login');
                        return;
                    }
                } catch {
                    console.error('Could not read error response');
                }
                
                if (groupResponse.status === 403 || groupResponse.status === 401) {
                    alert('이 채팅방에 접근할 권한이 없습니다. 다시 로그인 후 시도해주세요.');
                    localStorage.removeItem('token'); // 토큰이 만료되었을 수 있으므로 제거
                    router.push('/login');
                } else {
                    alert('채팅방 정보를 불러오는 중 오류가 발생했습니다.');
                    router.push('/');
                }
                return;
            }

            // 메시지 정보 가져오기 (프록시 사용)
            const messagesResponse = await fetch(`/api/proxy/chat/messages/${resolvedParams.id}`, {
                method: 'GET',
                headers,
                credentials: 'include',
                cache: 'no-store'
            });

            console.log('Messages response status:', messagesResponse.status);
            
            if (messagesResponse.ok) {
                const responseText = await messagesResponse.text();
                console.log('Messages data length:', responseText.length);
                
                try {
                    const messagesData = JSON.parse(responseText);
                    console.log(`Retrieved ${messagesData.length} messages`);
                    setMessages(messagesData);
                } catch (parseError) {
                    console.error('Failed to parse messages JSON:', parseError);
                    // 메시지 파싱 실패해도 계속 진행 (빈 메시지로)
                    setMessages([]);
                }
            } else {
                console.error('Failed to fetch messages:', messagesResponse.status);
                // 메시지 로드 실패해도 계속 진행 (빈 메시지로)
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
            router.push('/');
        }
    };

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

    useEffect(() => {
        // 데이터 초기화
        fetchData();
        
        // WebSocket 연결
        connectWebSocket();
        
        // 컴포넌트 언마운트 시 연결 해제
        return () => {
            if (stompClient) {
                console.log('Disconnecting WebSocket');
                try {
                    // @ts-ignore - stompjs의 disconnect 메서드 타입 호환성 문제
                    stompClient.disconnect(() => {
                        console.log('STOMP client disconnected');
                    });
                } catch (error) {
                    console.error('Error disconnecting STOMP client:', error);
                }
            }
        };
    }, [resolvedParams.id, router]);

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