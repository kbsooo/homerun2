'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { Client } from '@stomp/stompjs';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useThemeContext } from '../context/ThemeContext';

export default function TaxiPage() {
    const [destination, setDestination] = useState<'명지대' | '기흥역'>('명지대');
    const [memberCount, setMemberCount] = useState(0);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const router = useRouter();
    const { theme, darkMode, toggleDarkMode } = useThemeContext();

    useEffect(() => {
        const client = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            onConnect: () => {
                client.subscribe(`/topic/taxi-count/${destination}`, (message) => {
                    setMemberCount(parseInt(message.body));
                });
            },
        });

        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, [destination]);

    useEffect(() => {
        // Initial count fetch
        fetch(`http://localhost:8080/api/taxi/count/${destination}`)
            .catch(console.error);
    }, [destination]);

    const handleJoinGroup = async () => {
        try {
            const userId = localStorage.getItem('userId'); // From Kakao OAuth
            if (!userId) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await fetch('http://localhost:8080/api/taxi/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `userId=${userId}&destination=${destination}`,
            });

            if (response.ok) {
                const group = await response.json();
                router.push(`/chat/${group.groupId}`);
            }
        } catch (error) {
            console.error('Error joining group:', error);
            alert('그룹 참가 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className={`${theme} ${darkMode ? 'darkMode' : ''}`}>
            <Header isDarkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
            <main className={styles.container}>
                <div className={styles.toggleContainer}>
                    <button
                        className={`${styles.toggleButton} ${destination === '명지대' ? styles.active : ''}`}
                        onClick={() => setDestination('명지대')}
                    >
                        명지대행
                    </button>
                    <button
                        className={`${styles.toggleButton} ${destination === '기흥역' ? styles.active : ''}`}
                        onClick={() => setDestination('기흥역')}
                    >
                        기흥역행
                    </button>
                </div>

                <div className={styles.infoText}>
                    현재 {destination}으로 모집중인 사람이 {memberCount}명 있습니다.
                </div>

                <button className={styles.joinButton} onClick={handleJoinGroup}>
                    택시 그룹 모집하기
                </button>
            </main>
            <Footer />
        </div>
    );
}
