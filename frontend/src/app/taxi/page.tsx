'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useThemeContext } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Image from 'next/image';
import { FaTaxi, FaMapMarkerAlt } from 'react-icons/fa';

export default function TaxiPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('모집중...');
    const [isInValidLocation, setIsInValidLocation] = useState(false);
    const [isCheckingLocation, setIsCheckingLocation] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [manualLocationMode, setManualLocationMode] = useState(false);
    const router = useRouter();
    const { direction, setDirection } = useThemeContext();
    const initialCheckDone = useRef(false);

    // 디버깅용 로그 추가
    useEffect(() => {
        console.log('Current state: isInValidLocation =', isInValidLocation, ', locationError =', locationError, ', isCheckingLocation =', isCheckingLocation);
    }, [isInValidLocation, locationError, isCheckingLocation]);

    // Convert taxi destination to/from app direction
    const taxiDestination = direction === 'fromMJUtoGH' ? '기흥역' : '명지대';

    // Bounds configuration for different locations
    const bounds = {
        mju: [
            37.224134,
            127.187080,
            37.223561,
            127.188542
        ],
        gh: [
            37.275036,  // minLat
            127.115421, // minLng
            37.274146,   // maxLat
            127.115921   // maxLng
        ]
    };

    // 위치 확인 함수 (사용자 액션에 의해서만 호출됨)
    const checkLocation = useCallback(() => {
        setIsCheckingLocation(true);
        setLocationError(null);
        
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
                
                console.log('isInBounds:', isInBounds);
                console.log('Setting isInValidLocation to:', isInBounds);
                
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
                    // 위치가 유효할 때 명시적으로 에러를 null로 설정
                    console.log('Location verified successfully. isInValidLocation:', isInBounds);
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
                    setLocationError('위치 정보를 가져오는 데 시간이 너무 오래 걸립니다. 수동 설정을 이용해보세요.');
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
    }, [direction, bounds.mju, bounds.gh]);

    // Check if user is in valid location based on direction
    useEffect(() => {
        // 초기 마운트 시에만 위치 확인 실행
        if (!initialCheckDone.current && !manualLocationMode) {
            checkLocation();
            initialCheckDone.current = true;
        }
    }, [manualLocationMode, checkLocation]);

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

            // 먼저 이전에 참여한 모든 그룹에서 나가기 (ALREADY_IN_GROUP 오류 방지)
            try {
                const leaveResponse = await fetch(`/api/taxi/leave`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                
                // 이 API가 존재하지 않거나 실패해도 계속 진행
                if (leaveResponse.ok) {
                    console.log('Successfully left previous groups');
                } else {
                    console.warn('Failed to leave previous groups, continuing anyway');
                }
            } catch (error) {
                console.error('Error leaving previous groups:', error);
                // 오류가 발생해도 계속 진행
            }

            // API 호출 경로 설정 (상대 경로 사용)
            console.log('Joining taxi group');
            
            const response = await fetch(`/api/taxi/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include', // 쿠키 포함
                body: JSON.stringify({
                    destination: taxiDestination
                })
            });

            // 응답 내용 먼저 로깅
            const responseText = await response.text();
            console.log('Join group response:', responseText);
            
            if (!response.ok) {
                let errorMessage = '그룹 참가 중 오류가 발생했습니다.';
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.message === 'ALREADY_IN_GROUP') {
                        errorMessage = '이미 다른 택시 그룹에 참여중입니다.';
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    if (responseText.includes('Invalid CORS request')) {
                        errorMessage = 'CORS 오류: 백엔드 서버에 접근할 수 없습니다.';
                    } else if (response.status === 403) {
                        errorMessage = '접근 권한이 없습니다. 로그인 상태를 확인해주세요.';
                    }
                }
                
                alert(errorMessage);
                setIsLoading(false);
                return;
            }

            let groupData;
            try {
                groupData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing group data:', parseError);
                alert('서버 응답을 처리할 수 없습니다.');
                setIsLoading(false);
                return;
            }

            const { groupId, status } = groupData;

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
            } else {
                handleGroupComplete(groupId, { status, memberCount: groupData.memberCount });
            }

        } catch (error) {
            console.error('Error joining group:', error);
            alert('그룹 참가 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    const checkGroupStatus = async (groupId: string) => {
        try {
            // API 호출 경로 설정 (상대 경로 사용)
            const response = await fetch(`/api/taxi/group/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                    'Accept': 'application/json'
                },
                credentials: 'include' // 쿠키 포함
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
        // 방향 변경 시 위치 확인을 하지 않고 안내 메시지만 표시
        if (!manualLocationMode) {
            setIsCheckingLocation(false);
            if (newDestination === '기흥역') {
                setLocationError('명지대학교 내에서만 기흥역 방향 택시 모집이 가능합니다.');
            } else {
                setLocationError('기흥역 근처에서만 명지대 방향 택시 모집이 가능합니다.');
            }
            setIsInValidLocation(false);
        }
    };

    const checkLocationAgain = () => {
        setManualLocationMode(false);
        // 명시적으로 위치 확인 함수 호출
        checkLocation();
    };

    const enableManualLocationMode = () => {
        setManualLocationMode(true);
        setIsInValidLocation(true);
        setLocationError(null);
        setIsCheckingLocation(false);
    };

    return (
        <div className={styles.pageWrapper}>
            <Header />
            <main className={styles.container}>
                {isLoading && (
                    <LoadingSpinner message={loadingMessage} isModal={true} />
                )}
                <div className={styles.introSection}>
                    <h1 className={styles.pageTitle}>
                        <span style={{display: 'flex', alignItems: 'center'}}>
                            <FaTaxi size={20} color="#3498db" />
                            <span style={{marginLeft: '8px'}}>택시 그룹 모집</span>
                        </span>
                    </h1>
                    <p className={styles.introText}>
                        버스를 놓쳤거나 급하게 학교로 가야 할 때<br />
                        택시 그룹을 모집해 보세요!
                    </p>
                </div>

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

                <div className={styles.locationSection}>
                    {manualLocationMode ? (
                        <div className={styles.locationConfirm}>
                            <div className={styles.locationHeader}>
                                <FaMapMarkerAlt size={20} color="#27ae60" />
                                <h2>수동 위치 모드 활성화됨</h2>
                            </div>
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
                            <div className={styles.pulsingDot}></div>
                            위치 확인 중입니다...
                        </div>
                    ) : locationError ? (
                        <div className={styles.locationError}>
                            <div className={styles.locationHeader}>
                                <FaMapMarkerAlt size={20} color="#e74c3c" />
                                <h2>위치 오류</h2>
                            </div>
                            <p>{locationError}</p>
                            {/* 방향에 따라 적절한 이미지를 표시합니다 */}
                            <div className={styles.boundsImageContainer}>
                                {direction === 'fromMJUtoGH' ? (
                                    <Image 
                                        src="/taxi/mjuBounds.png" 
                                        alt="명지대 위치 범위" 
                                        width={300} 
                                        height={200}
                                        className={styles.boundsImage}
                                    />
                                ) : (
                                    <Image 
                                        src="/taxi/ghBounds.png" 
                                        alt="기흥역 위치 범위" 
                                        width={300} 
                                        height={200}
                                        className={styles.boundsImage}
                                    />
                                )}
                            </div>
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
                    ) : isInValidLocation ? (
                        <div className={styles.locationSuccess}>
                            <div className={styles.locationHeader}>
                                <FaMapMarkerAlt size={20} color="#27ae60" />
                                <h2>위치가 검증되었습니다</h2>
                            </div>
                            <p className={styles.locationSubtext}>
                                {direction === 'fromMJUtoGH' 
                                    ? '명지대학교 내에서 기흥역 방향 택시 모집이 가능합니다.' 
                                    : '기흥역 근처에서 명지대 방향 택시 모집이 가능합니다.'}
                            </p>
                        </div>
                    ) : null}
                </div>

                <button 
                    className={`${styles.joinButton} ${(!isInValidLocation && !manualLocationMode) || isCheckingLocation ? styles.disabled : ''}`} 
                    onClick={handleJoinGroup}
                    disabled={(!isInValidLocation && !manualLocationMode) || isCheckingLocation}
                >
                    <FaTaxi size={18} color="#fff" /> <span>택시 그룹 모집하기</span>
                </button>
            </main>
            <Footer />
        </div>
    );
}
