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
    const [participatingGroupId, setParticipatingGroupId] = useState<string | null>(null);
    const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
    const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set());

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

    const handleJoinGroup = async (groupId: string) => {
        // 이미 참여 중이거나 로딩 중인 경우 중복 요청 방지
        if (participatingGroupId === groupId || isLoading) {
            return;
        }

        // 위치 검증 확인
        if (!manualLocationMode && !isInValidLocation) {
            if (direction === 'fromMJUtoGH') {
                alert('명지대학교 내에서만 기흥역 방향 택시 모집이 가능합니다.');
            } else {
                alert('기흥역 근처에서만 명지대 방향 택시 모집이 가능합니다.');
            }
            return;
        }

        // 토큰 확인
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        
        // 로딩 상태 시작
        setIsLoading(true);
        setLoadingMessage('모집중...');

        try {
            // 이전 그룹에서 나가기 (참여 중인 그룹이 있는 경우)
            if (participatingGroupId) {
                console.log(`Leaving previous group ${participatingGroupId} before joining new group ${groupId}`);
                await fetch(`/api/proxy/taxi/group/leave/${participatingGroupId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log('Leave previous group response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`Failed to leave group: ${response.status}`);
                    }
                    return response.text();
                })
                .then(text => {
                    console.log('Leave group response:', text || 'No response body');
                })
                .catch(error => {
                    console.error('Error leaving previous group:', error);
                    // 이전 그룹 탈퇴 실패해도 새 그룹 참여는 시도
                    console.log('Continuing to join new group despite leave error');
                });
            }

            // 새 그룹 참여하기
            console.log(`Joining group ${groupId}...`);
            const joinResponse = await fetch(`/api/proxy/taxi/group/join/${groupId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Join group response status:', joinResponse.status);
            const responseText = await joinResponse.text();
            console.log('Join group response text:', responseText || 'No response body');

            if (joinResponse.ok) {
                try {
                    // 응답이 JSON인 경우 파싱 시도
                    if (responseText && responseText.trim().startsWith('{')) {
                        const data = JSON.parse(responseText);
                        console.log('Parsed join response:', data);
                        setParticipatingGroupId(groupId);
                        setJoinedGroups(prev => new Set(prev).add(groupId));
                        
                        // 그룹 상태 확인 (바로 완료되었을 수 있음)
                        checkGroupStatus(groupId);
                    } else {
                        setParticipatingGroupId(groupId);
                        setJoinedGroups(prev => new Set(prev).add(groupId));
                        checkGroupStatus(groupId);
                    }
                } catch (error) {
                    console.error('Error parsing join response:', error);
                    // 파싱 실패해도 참여는 성공한 것으로 처리
                    setParticipatingGroupId(groupId);
                    setJoinedGroups(prev => new Set(prev).add(groupId));
                    checkGroupStatus(groupId);
                }
            } else {
                // 오류 처리: 상태 코드별 메시지
                console.error('Failed to join group:', joinResponse.status, responseText);
                
                if (joinResponse.status === 401 || joinResponse.status === 403) {
                    alert('로그인이 필요하거나 세션이 만료되었습니다.');
                    router.push('/login');
                } else if (joinResponse.status === 409) {
                    alert('이미 다른 그룹에 참여 중입니다.');
                } else if (joinResponse.status === 400) {
                    alert('잘못된 요청입니다. 페이지를 새로고침 해주세요.');
                } else {
                    alert('그룹 참여 중 오류가 발생했습니다.');
                }
            }
        } catch (error) {
            console.error('Error in handleJoinGroup:', error);
            alert('그룹 참여 처리 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    const checkGroupStatus = async (groupId: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found for checking group status');
            return;
        }

        try {
            console.log(`Checking status for group ${groupId}...`);
            const statusResponse = await fetch(`/api/proxy/taxi/group/status/${groupId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Group status response status:', statusResponse.status);
            
            if (statusResponse.ok) {
                const responseText = await statusResponse.text();
                console.log('Group status raw response:', responseText);
                
                try {
                    if (responseText && responseText.trim()) {
                        const data = JSON.parse(responseText);
                        console.log('Parsed group status data:', data);
                        
                        // 그룹이 완료 상태인 경우
                        if (data.status === 'COMPLETE') {
                            console.log('Group is complete, handling completion...');
                            handleGroupComplete(groupId, data.memberCount);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing group status response:', error);
                }
            } else {
                console.error('Failed to check group status:', statusResponse.status);
                
                try {
                    const errorText = await statusResponse.text();
                    console.error('Status error response:', errorText);
                } catch {
                    console.error('Could not read status error response');
                }
            }
        } catch (error) {
            console.error('Error in checkGroupStatus:', error);
            setIsLoading(false);
        }
    };

    const handleGroupComplete = (groupId: string, memberCount: number) => {
        // 로딩 상태 종료
        setIsLoading(false);
        
        console.log(`Group ${groupId} is complete with ${memberCount} members`);
        
        // memberCount가 undefined이거나 0인 경우, 최소 1로 설정 (본인)
        if (!memberCount || isNaN(memberCount) || memberCount <= 0) {
            console.log('memberCount is undefined or 0, setting to 1 (self)');
            memberCount = 1;
        }
        
        // 클라이언트 측 상태 업데이트
        setParticipatingGroupId(null);
        setCompletedGroups(prev => new Set(prev).add(groupId));
        
        // 토큰과 그룹 ID 저장 (채팅방 접근용)
        const token = localStorage.getItem('token');
        console.log(`Stored token for chat access: ${token?.substring(0, 10)}...`);
        console.log(`Redirecting to chat room for group: ${groupId}`);
        
        // 채팅방으로 이동
        alert(`${memberCount}명이 모였습니다. 채팅방으로 이동합니다.`);
        router.push(`/chat/${groupId}`);
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
                    onClick={() => handleJoinGroup(taxiDestination)}
                    disabled={(!isInValidLocation && !manualLocationMode) || isCheckingLocation}
                >
                    <FaTaxi size={18} color="#fff" /> <span>택시 그룹 모집하기</span>
                </button>
            </main>
            <Footer />
        </div>
    );
}
