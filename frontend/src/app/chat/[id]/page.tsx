'use client';

import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import styles from './page.module.css';

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

export default function ChatPage({ params }: { params: { id: string } }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [group, setGroup] = useState<Group | null>(null);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Fetch group info
        fetch(`http://localhost:8080/api/taxi/group/${params.id}`)
            .then(res => res.json())
            .then(setGroup)
            .catch(console.error);

        // Fetch chat history
        fetch(`http://localhost:8080/api/taxi/chat/${params.id}`)
            .then(res => res.json())
            .then(setMessages)
            .catch(console.error);

        // Setup WebSocket
        const client = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            onConnect: () => {
                client.subscribe(`/topic/chat/${params.id}`, (message) => {
                    const newMsg = JSON.parse(message.body);
                    setMessages(prev => [...prev, newMsg]);
                });
            },
        });

        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, [params.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim() || !stompClient) return;

        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');

        if (!userId || !userName) {
            alert('로그인이 필요합니다.');
            return;
        }

        const message = {
            groupId: params.id,
            senderId: userId,
            senderName: userName,
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        stompClient.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(message)
        });

        setNewMessage('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{group?.destination} 택시 그룹</h2>
                <p>그룹 ID: {params.id}</p>
                <p>현재 인원: {group?.currentMembers}/4</p>
            </div>

            <div className={styles.messageContainer}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`${styles.message} ${
                            msg.senderId === localStorage.getItem('userId')
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
        </div>
    );
} 