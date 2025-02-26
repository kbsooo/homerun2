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
    const [isInValidLocation, setIsInValidLocation] = useState(false);
    const [isCheckingLocation, setIsCheckingLocation] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [manualLocationMode, setManualLocationMode] = useState(false);
    const router = useRouter();
    const { darkMode, toggleDarkMode, direction, setDirection } = useThemeContext();

    // Convert taxi destination to/from app direction
    const taxiDestination = direction === 'fromMJUtoGH' ? '기흥역' : '명지대';

    // Bounds configuration for different locations
    const bounds = {
        mju: [
            37.224238,  // minLat
            127.187856, // minLng
            37.22938,   // maxLat
            127.19028   // maxLng
        ],
        gh: [
            37.274678,  // minLat
            127.115739, // minLng
            37.27749,   // maxLat
            127.12048   // maxLng
        ]
    };

    // Check if user is in valid location based on direction
    useEffect(() => {
        if (manualLocationMode) {
            return; // 수동 위치 모드에서는 자동 위치 체크를 하지 않음
        }
        
        setIsCheckingLocation(true);
        setLocationError(null);
        
        const checkLocation = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('Current location:', latitude, longitude);
                    
                    // Determine which bounds to check based on direction
                    const boundsToCheck = direction === 'fromMJUtoGH' ? bounds.mju : bounds.gh;
                    
                    // Check if user is within bounds
                    const isInBounds = 
                        latitude >= boundsToCheck[0] && 
                        longitude >= boundsToCheck[1] && 
                        latitude <= boundsToCheck[2] && 
                        longitude <= boundsToCheck[3];
                    
                    setIsInValidLocation(isInBounds);
                    setIsCheckingLocation(false);
                    
                    if (!isInBounds) {
                        if (direction === 'fromMJUtoGH') {
                            setLocationError('명지대학교 내에서만 기흥역 방향 택시 모집이 가능합니다.');
                        } else {
                            setLocationError('기흥역 근처에서만 명지대 방향 택시 모집이 가능합니다.');
                        }
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    
                    // 에러 유형에 따른 다른 메시지 표시
                    if (error.code === 1) {
                        // PERMISSION_DENIED
                        setLocationError('위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
                    } else if (error.code === 2) {
                        // POSITION_UNAVAILABLE
                        setLocationError('현재 위치를 확인할 수 없습니다. GPS 신호가 약하거나 위치 서비스가 비활성화되었을 수 있습니다.');
                    } else if (error.code === 3) {
                        // TIMEOUT
                        setLocationError('위치 정보를 가져오는 데 시간이 너무 오래 걸립니다.');
                    } else {
                        setLocationError('위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
                    }
                    
                    setIsCheckingLocation(false);
                },
                { 
                    enableHighAccuracy: false, // 정확도 요구사항 완화
                    timeout: 20000, // 타임아웃 늘림 (20초)
                    maximumAge: 60000 // 캐시된 위치 사용 허용 시간 늘림
                }
            );
        };
        
        checkLocation();
        // 일정 시간마다 위치 업데이트
        const intervalId = setInterval(checkLocation, 60000); // 1분마다 위치 체크
        
        return () => clearInterval(intervalId);
    }, [direction, manualLocationMode, bounds.gh, bounds.mju]);

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

            // 위치 확인 스킵 (수동 모드이거나 유효한 위치인 경우)
            if (!manualLocationMode && !isInValidLocation) {
                if (direction === 'fromMJUtoGH') {
                    alert('명지대학교 내에서만 기흥역 방향 택시 모집이 가능합니다.');
                } else {
                    alert('기흥역 근처에서만 명지대 방향 택시 모집이 가능합니다.');
                }
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

    const handleGroupComplete = (groupId: string, groupStatus: { status: string; memberCount: number }) => {
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

    const checkLocationAgain = () => {
        setIsCheckingLocation(true);
        setManualLocationMode(false);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                // Determine which bounds to check based on direction
                const boundsToCheck = direction === 'fromMJUtoGH' ? bounds.mju : bounds.gh;
                
                // Check if user is within bounds
                const isInBounds = 
                    latitude >= boundsToCheck[0] && 
                    longitude >= boundsToCheck[1] && 
                    latitude <= boundsToCheck[2] && 
                    longitude <= boundsToCheck[3];
                
                setIsInValidLocation(isInBounds);
                setIsCheckingLocation(false);
                
                if (!isInBounds) {
                    if (direction === 'fromMJUtoGH') {
                        setLocationError('명지대학교 내에서만 기흥역 방향 택시 모집이 가능합니다.');
                    } else {
                        setLocationError('기흥역 근처에서만 명지대 방향 택시 모집이 가능합니다.');
                    }
                } else {
                    setLocationError(null);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                
                // 에러 유형에 따른 다른 메시지 표시
                if (error.code === 1) {
                    // PERMISSION_DENIED
                    setLocationError('위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
                } else if (error.code === 2) {
                    // POSITION_UNAVAILABLE
                    setLocationError('현재 위치를 확인할 수 없습니다. GPS 신호가 약하거나 위치 서비스가 비활성화되었을 수 있습니다.');
                } else if (error.code === 3) {
                    // TIMEOUT
                    setLocationError('위치 정보를 가져오는 데 시간이 너무 오래 걸립니다.');
                } else {
                    setLocationError('위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
                }
                
                setIsCheckingLocation(false);
            },
            { 
                enableHighAccuracy: false, // 정확도 요구사항 완화
                timeout: 20000, // 타임아웃 늘림 (20초)
                maximumAge: 60000 // 캐시된 위치 사용 허용 시간 늘림
            }
        );
    };

    const enableManualLocationMode = () => {
        setManualLocationMode(true);
        setIsInValidLocation(true);
        setLocationError(null);
        setIsCheckingLocation(false);
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

                        {manualLocationMode ? (
                            <div className={styles.locationConfirm}>
                                <p>수동 위치 모드 활성화됨</p>
                                <p className={styles.locationSubtext}>
                                    {direction === 'fromMJUtoGH' 
                                        ? '명지대학교에 있음을 확인합니다.' 
                                        : '기흥역 근처에 있음을 확인합니다.'}
                                </p>
                                <button 
                                    className={styles.checkLocationButton} 
                                    onClick={() => {
                                        setManualLocationMode(false);
                                        checkLocationAgain();
                                    }}
                                >
                                    자동 위치 확인으로 전환
                                </button>
                            </div>
                        ) : isCheckingLocation ? (
                            <div className={styles.locationMessage}>
                                위치 확인 중입니다...
                            </div>
                        ) : locationError ? (
                            <div className={styles.locationError}>
                                <p>{locationError}</p>
                                <div className={styles.locationButtonGroup}>
                                    <button 
                                        className={styles.checkLocationButton} 
                                        onClick={checkLocationAgain}
                                    >
                                        위치 다시 확인하기
                                    </button>
                                    <button 
                                        className={styles.manualLocationButton} 
                                        onClick={enableManualLocationMode}
                                    >
                                        수동으로 위치 설정하기
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        <button 
                            className={`${styles.joinButton} ${(!isInValidLocation && !manualLocationMode) || isCheckingLocation ? styles.disabled : ''}`} 
                            onClick={handleJoinGroup}
                            disabled={(!isInValidLocation && !manualLocationMode) || isCheckingLocation}
                        >
                            택시 그룹 모집하기
                        </button>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
