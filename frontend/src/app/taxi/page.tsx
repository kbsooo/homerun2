'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { Client } from '@stomp/stompjs';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useThemeContext } from '../context/ThemeContext';
import SockJS from 'sockjs-client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TaxiPage() {
    const [memberCount, setMemberCount] = useState(0);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('모집중...');
    const router = useRouter();
    const { theme, darkMode, toggleDarkMode, direction, setDirection } = useThemeContext();

    // Convert taxi destination to/from app direction
    const taxiDestination = direction === 'fromMJUtoGH' ? '기흥역' : '명지대';

    useEffect(() => {
        let client: Client | null = null;
        
        const initializeWebSocket = () => {
            client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                onConnect: () => {
                    console.log('Connected to WebSocket');
                    client?.subscribe(`/topic/taxi-count/${taxiDestination}`, (message) => {
                        console.log('Received count:', message.body);
                        setMemberCount(parseInt(message.body));
                    });
                },
                onWebSocketError: (error) => {
                    console.error('WebSocket error:', error);
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                },
                debug: (str) => {
                    console.log('STOMP debug:', str);
                }
            });

            client.activate();
            setStompClient(client);
        };

        initializeWebSocket();

        return () => {
            if (client?.active) {
                client.deactivate();
            }
        };
    }, [taxiDestination]);

    useEffect(() => {
        fetch(`http://localhost:8080/api/taxi/count/${taxiDestination}`)
            .catch(console.error);
    }, [taxiDestination]);

    const handleJoinGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            setIsLoading(true);
            setLoadingMessage('모집중...');

            const response = await fetch('http://localhost:8080/api/taxi/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    destination: taxiDestination
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message === 'ALREADY_IN_GROUP') {
                    alert('이미 다른 택시 그룹에 참여중입니다.');
                    setIsLoading(false);
                    return;
                }
                throw new Error(errorData.message);
            }

            const { groupId, status, memberCount } = await response.json();

            if (status === 'WAITING') {
                let timeLeft = 15;
                const timer = setInterval(() => {
                    timeLeft--;
                    setLoadingMessage(`모집중... ${timeLeft}초 남음`);
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        checkGroupStatus(groupId);
                    }
                }, 1000);

                // Subscribe to group updates
                stompClient?.subscribe(`/topic/taxi-group/${groupId}`, (message) => {
                    const groupStatus = JSON.parse(message.body);
                    if (groupStatus.status === 'COMPLETE' || groupStatus.status === 'PARTIAL') {
                        clearInterval(timer);
                        handleGroupComplete(groupId, groupStatus);
                    }
                });
            } else {
                handleGroupComplete(groupId, { status, memberCount });
            }

        } catch (error) {
            console.error('Error joining group:', error);
            alert('그룹 참가 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    const checkGroupStatus = async (groupId: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/taxi/group/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const groupStatus = await response.json();
                handleGroupComplete(groupId, groupStatus);
            }
        } catch (error) {
            console.error('Error checking group status:', error);
            setIsLoading(false);
        }
    };

    const handleGroupComplete = (groupId: string, groupStatus: any) => {
        setIsLoading(false);
        
        if (groupStatus.status === 'COMPLETE') {
            router.push(`/chat/${groupId}`);
        } else if (groupStatus.status === 'PARTIAL') {
            alert(`${groupStatus.memberCount}명이 모였습니다. 적은 인원으로 채팅방을 개설합니다.`);
            router.push(`/chat/${groupId}`);
        } else if (groupStatus.status === 'FAILED') {
            alert('모집에 실패했습니다.');
            router.push('/taxi');
        }
    };

    const handleDestinationChange = (newDestination: '명지대' | '기흥역') => {
        setDirection(newDestination === '기흥역' ? 'fromMJUtoGH' : 'fromGHtoMJU');
    };

    return (
        <div>
            <Header isDarkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
            <main className={styles.container}>
                {isLoading ? (
                    <LoadingSpinner message={loadingMessage} />
                ) : (
                    <>
                        <div className={styles.toggleContainer}>
                            <button
                                className={`${styles.toggleButton} ${taxiDestination === '명지대' ? styles.active : ''}`}
                                onClick={() => handleDestinationChange('명지대')}
                            >
                                명지대행
                            </button>
                            <button
                                className={`${styles.toggleButton} ${taxiDestination === '기흥역' ? styles.active : ''}`}
                                onClick={() => handleDestinationChange('기흥역')}
                            >
                                기흥역행
                            </button>
                        </div>

                        <div className={styles.infoText}>
                            현재 {taxiDestination}으로 모집중인 사람이 {memberCount}명 있습니다.
                        </div>

                        <button className={styles.joinButton} onClick={handleJoinGroup}>
                            택시 그룹 모집하기
                        </button>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
