'use client';

import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import styles from './page.module.css';
import SockJS from 'sockjs-client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useThemeContext } from '../../context/ThemeContext';
import { use } from 'react';

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [group, setGroup] = useState<Group | null>(null);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { theme, darkMode, toggleDarkMode } = useThemeContext();

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const initializeWebSocket = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                onConnect: () => {
                    console.log('Connected to chat WebSocket');
                    client.subscribe(`/topic/chat/${resolvedParams.id}`, (message) => {
                        const newMsg = JSON.parse(message.body);
                        setMessages(prev => [...prev, newMsg]);
                    });
                    client.subscribe(`/topic/group/${resolvedParams.id}`, (message) => {
                        const updatedGroup = JSON.parse(message.body);
                        setGroup(updatedGroup);
                    });
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                },
                debug: (str) => {
                    console.log('STOMP debug:', str);
                }
            });

            client.activate();
            return client;
        };

        // Fetch initial data
        const fetchData = async () => {
            try {
                const [groupResponse, messagesResponse] = await Promise.all([
                    fetch(`http://localhost:8080/api/taxi/group/${resolvedParams.id}`),
                    fetch(`http://localhost:8080/api/taxi/chat/${resolvedParams.id}`)
                ]);

                if (groupResponse.ok) {
                    const groupData = await groupResponse.json();
                    setGroup(groupData);
                }

                if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    setMessages(messagesData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        const client = initializeWebSocket();
        setStompClient(client);

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [resolvedParams.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim() || !stompClient?.active) return;

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

            stompClient.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(message)
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('메시지 전송에 실패했습니다.');
        }
    };

    return (
        <div className={`${theme} ${darkMode ? 'darkMode' : ''}`}>
            <Header isDarkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
            <main className={styles.container}>
                <div className={styles.header}>
                    <h2>#{resolvedParams.id}</h2>
                    <p>현재 인원: {group?.currentMembers || 0}/4</p>
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
                    <button onClick={handleSend} className={styles.sendButton}>
                        전송
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
} 