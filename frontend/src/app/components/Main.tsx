'use client';
import React, { useState, useEffect } from 'react';
import styles from './Main.module.css';
import { useThemeContext } from '../context/ThemeContext';
// import { useForm } from '@formspree/react';

interface BusInfo {
  도착시간: string;
  버스번호: string;
  남은좌석수: string;
  도착시간2?: string;
  남은좌석수2?: string;
}

interface ShuttleInfo {
  message?: string;
  routes?: {
    giheung?: {
      name: string;
      time: number;
    };
    everline?: {
      name: string;
      time: number;
      connection: number;
    };
  };
}

interface TransportCard {
  type: 'bus' | 'shuttle';
  time: number;
  title: string;
  subtitle?: string;
  additionalInfo?: string;
  isGiheungShuttle?: boolean;
}

// 버스별 상세 정보 데이터
const busDetailInfo: { [key: string]: { [key: string]: string | {fromGHtoMJU: string, fromMJUtoGH: string} } } = {
  '5005': {
    운행시간: '첫차: 05:30, 막차: 23:00',
    배차간격: '11~18분',
    노선정보: '명지대 ↔ 서울역버스환승센터',
    소요시간: {
      fromGHtoMJU: '명지대까지 약 35분 소요',
      fromMJUtoGH: '기흥역까지 약 35분 소요'
    }
  },
  '820': {
    운행시간: '첫차: 05:00, 막차: 23:10',
    노선정보: '명지대 ↔ 정자역',
    소요시간: {
      fromGHtoMJU: '명지대까지 약 35분 소요',
      fromMJUtoGH: '기흥역까지 약 35분 소요'
    }
  },
  '5600': {
    운행시간: '첫차: 05:40, 막차: 23:00',
    배차간격: '8~13분',
    노선정보: '명지대 ↔ 강변역',
    소요시간: {
      fromGHtoMJU: '명지대까지 약 32분 소요',
      fromMJUtoGH: '기흥역까지 약 32분 소요'
    }
  },
  '5003A': {
    운행시간: '첫차: 05:10, 막차: 13:55',
    배차간격: '10~15분',
    노선정보: '명지대앞 ↔ 신논현역',
    소요시간: {
      fromGHtoMJU: '명지대까지 약 38분 소요',
      fromMJUtoGH: '기흥역까지 약 38분 소요'
    }
  },
  '5003B': {
    운행시간: '첫차: 14:10, 막차: 23:15',
    배차간격: '10~15분',
    노선정보: '명지대앞 ↔ 신논현역',
    소요시간: {
      fromGHtoMJU: '명지대까지 약 38분 소요',
      fromMJUtoGH: '기흥역까지 약 38분 소요'
    }
  }
};

const BusIcon = ({ busNumber, className }: { busNumber: string, className?: string }) => {
  const getBusColor = (busNumber: string) => {
    if (['5005', '5600', '5003A', '5003B'].includes(busNumber)) {
      return '#EE2737';
    }
    if (busNumber === '820') {
      return '#33CC99';
    }
    return 'currentColor'; // 테마 색상 사용
  };

  return (
    <svg 
      className={className} 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill={getBusColor(busNumber)}
    >
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
  );
};

export default function Main() {
  const [busData, setBusData] = useState<BusInfo[]>([]);
  const [shuttleData, setShuttleData] = useState<ShuttleInfo | null>(null);
  const [currentTime, setCurrentTime] = useState({
    time: "",
    period: ""
  });
  const [error, setError] = useState<string | null>(null);
  const { darkMode, direction, setDirection } = useThemeContext();
  const [flippedCards, setFlippedCards] = useState<{[key: string]: boolean}>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingCardIndex, setSubmittingCardIndex] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<Date | null>(null);
  const [canSubmit, setCanSubmit] = useState<boolean>(true);
  // const [formState, handleFormSubmit] = useForm("xqaerdol");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 현재 시간 체크
        const now = new Date();
        const day = now.getDay();
        // const hour = now.getHours();
        const isWeekend = day === 0 || day === 6;
        // const isOperatingHours = hour >= 6 && hour < 23;
        const isOperatingHours = true; //테스트용

        if (!isOperatingHours) {
          setBusData([]);
          setShuttleData({ message: '버스 운행 시간이 아닙니다. (운행 시간: 06:00 ~ 23:00)' });
          setError(null);
          return;
        }

        if (isWeekend) {
          setShuttleData({ message: '주말에는 셔틀버스가 운행하지 않습니다.' });
        }

        // 버스 데이터 가져오기
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '//3.27.108.105:8080';
        const busEndpoint = direction === 'fromMJUtoGH' 
          ? `/bus/fromMJUtoGH` 
          : `/bus/fromGHtoMJU`;
        
        try {
          const busResponse = await fetch(`${backendUrl}${busEndpoint}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          const busData = await busResponse.json();
          
          if (Array.isArray(busData)) {
            console.log(`받은 버스 데이터: ${busData.length}개`);
            setBusData(busData);
            setError(null);
          } else {
            console.error('Invalid bus data format');
            setBusData([]);
            setError('버스 정보를 불러올 수 없습니다.');
          }
        } catch {
          console.error('버스 정보 조회 실패');
          setBusData([]);
          setError('버스 정보를 불러올 수 없습니다.');
        }

        // 주말이 아닐 때만 셔틀 데이터 가져오기
        if (!isWeekend) {
          try {
            // 백엔드 서버 URL 직접 사용
            const shuttleEndpoint = `/api/shuttle/${direction}`;
            const shuttleResponse = await fetch(`${backendUrl}${shuttleEndpoint}`);
            
            if (shuttleResponse.ok) {
              const shuttleData = await shuttleResponse.json();
              setShuttleData(shuttleData);
            } else {
              setShuttleData(null);
            }
          } catch {
            console.error('셔틀 정보 조회 실패');
            setShuttleData(null);
          }
        }
      } catch {
        console.error('데이터를 불러오는데 실패했습니다');
        setBusData([]);
        setShuttleData(null);
        setError('정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [direction]);

  useEffect(() => {
    const updateTimer = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      const period = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      setCurrentTime({
        time: `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`,
        period: period
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분`;
  };

  const handleCardFlip = (index: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Function to check authentication status - 실제 토큰 확인 로직으로 변경
  useEffect(() => {
    // 테스트 코드 제거
    // setIsLoggedIn(true);
    
    // 실제 로그인 상태 확인 로직 복원
    let token = null;
    
    // 다양한 토큰 저장 위치 및 키 이름 확인
    // 1. userToken에서 직접 확인
    token = localStorage.getItem('token') || localStorage.getItem('userToken') || sessionStorage.getItem('token') || sessionStorage.getItem('userToken');
    
    // 2. token이 없으면 userInfo 객체 내부에서 확인
    let nickname = null;
    try {
      // localStorage에서 userInfo를 가져와 파싱
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        nickname = userInfo.nickname;
        
        // userInfo 안에 토큰이 있는지 확인
        if (!token && userInfo.token) {
          token = userInfo.token;
        }
      }
      
      // 세션스토리지에서도 체크
      if (!nickname || !token) {
        const sessionUserInfoStr = sessionStorage.getItem('userInfo');
        if (sessionUserInfoStr) {
          const sessionUserInfo = JSON.parse(sessionUserInfoStr);
          if (!nickname) nickname = sessionUserInfo.nickname;
          if (!token && sessionUserInfo.token) token = sessionUserInfo.token;
        }
      }
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
    }
    
    // 토큰과 닉네임이 모두 있어야 로그인된 것으로 간주
    setIsLoggedIn(!!token && !!nickname);
    setUserToken(token);
    setUserName(nickname);
    
    // 마지막 제출 시간 가져오기
    const lastSubmissionTime = localStorage.getItem('lastBoardingSubmission');
    if (lastSubmissionTime) {
      const lastTime = new Date(lastSubmissionTime);
      setLastSubmission(lastTime);
      
      // 현재 시간과 마지막 제출 시간의 차이 계산 (밀리초)
      const currentTime = new Date();
      const timeDiff = currentTime.getTime() - lastTime.getTime();
      
      // 1시간(3600000 밀리초) 이내에 제출했다면 다시 제출할 수 없음
      const canSubmitAgain = timeDiff > 3600000;
      setCanSubmit(canSubmitAgain);
      
      if (!canSubmitAgain) {
        // 다음 제출까지 남은 시간 계산 (분)
        const minutesLeft = Math.ceil((3600000 - timeDiff) / 60000);
        console.log(`다음 탑승 보고까지 ${minutesLeft}분 남았습니다.`);
      }
    }
  }, []);

  // Handle boarding report submission using direct fetch instead of Formspree hook if needed
  const handleDirectSubmission = async (data: {
    userName: string;
    direction: string;
    dayOfWeek: string;
    boardingTime: string;
    userToken: string; // 토큰 추가
  }, cardIndex: number) => {
    try {
      setIsSubmitting(true);
      setSubmittingCardIndex(cardIndex);
      setSubmitFeedback("제출 중...");
      
      // 토큰 검증 추가
      if (!data.userToken) {
        setSubmitFeedback("인증 정보가 없습니다. 다시 로그인해주세요.");
        setTimeout(() => setSubmitFeedback(null), 3000);
        return;
      }
      
      // 익명 제출 방지
      if (!data.userName || data.userName === '익명') {
        setSubmitFeedback("사용자 이름이 필요합니다. 설정에서 이름을 등록해주세요.");
        setTimeout(() => setSubmitFeedback(null), 3000);
        return;
      }
      
      const response = await fetch('https://formspree.io/f/xqaerdol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${data.userToken}` // 토큰 인증 정보 포함
        },
        body: JSON.stringify(data),
      });
      
      // response.ok만 확인하고 result는 저장하지 않음
      await response.json();
      
      if (response.ok) {
        // 제출 성공 시 마지막 제출 시간 저장
        const now = new Date();
        localStorage.setItem('lastBoardingSubmission', now.toISOString());
        setLastSubmission(now);
        setCanSubmit(false);
        
        setSubmitFeedback("감사합니다! 제공해주신 정보는 더 나은 서비스를 위해 활용됩니다.");
        setTimeout(() => {
          setSubmitFeedback(null);
          setSubmittingCardIndex(null);
        }, 3000);
      } else {
        setSubmitFeedback("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
        setTimeout(() => {
          setSubmitFeedback(null);
          setSubmittingCardIndex(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Direct submission error:', error);
      setSubmitFeedback("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
      setTimeout(() => {
        setSubmitFeedback(null);
        setSubmittingCardIndex(null);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle boarding report submission
  const handleBoardingReport = (cardIndex: number) => {
    // 로그인 검증 활성화
    if (!isLoggedIn || !userToken || !userName) {
      setSubmitFeedback("로그인이 필요합니다.");
      setTimeout(() => setSubmitFeedback(null), 3000);
      return;
    }
    
    // 1시간 제한 검증
    if (!canSubmit) {
      // 다음 제출까지 남은 시간 계산 (분)
      const currentTime = new Date();
      const timeDiff = currentTime.getTime() - (lastSubmission?.getTime() || 0);
      const minutesLeft = Math.ceil((3600000 - timeDiff) / 60000);
      
      setSubmitFeedback(`1시간에 한 번만 제출할 수 있습니다. ${minutesLeft}분 후에 다시 시도해주세요.`);
      setSubmittingCardIndex(cardIndex);
      setTimeout(() => {
        setSubmitFeedback(null);
        setSubmittingCardIndex(null);
      }, 3000);
      return;
    }

    // Get current date and time information
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayOfWeek = days[now.getDay()];
    const timeString = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS
    
    // '익명' 폴백 제거
    if (!userName) {
      setSubmitFeedback("사용자 이름이 필요합니다. 설정에서 이름을 등록해주세요.");
      setTimeout(() => setSubmitFeedback(null), 3000);
      return;
    }

    // Prepare data for submission
    const submissionData = {
      userName: userName,
      direction: direction,
      dayOfWeek: dayOfWeek,
      boardingTime: timeString,
      userToken: userToken // 토큰 추가
    };

    try {
      // Try direct submission instead of using Formspree hook
      handleDirectSubmission(submissionData, cardIndex);
    } catch (error) {
      console.error('Error during submission:', error);
      setSubmitFeedback("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
      setSubmittingCardIndex(null);
    }
  };

  const convertToTransportCard = (data: BusInfo[] | ShuttleInfo | null): TransportCard[] => {
    const cards: TransportCard[] = [];

    // Add bus data
    if (data && Array.isArray(data)) {
      data.forEach((bus) => {
        if (bus && bus.도착시간 && bus.버스번호) {
          const arrivalTime = parseInt(bus.도착시간);
          if (!isNaN(arrivalTime)) {
            cards.push({
              type: 'bus',
              time: arrivalTime,
              title: bus.버스번호,
              subtitle: `${bus.도착시간}분`,
              additionalInfo: bus.남은좌석수 || '정보 없음'
            });
          }
        }
      });
    }

    // Add shuttle data
    if (shuttleData?.routes) {
      if (shuttleData.routes.giheung && typeof shuttleData.routes.giheung.time === 'number') {
        cards.push({
          type: 'shuttle',
          time: shuttleData.routes.giheung.time,
          title: '기흥역 셔틀버스',
          subtitle: formatTime(shuttleData.routes.giheung.time),
          additionalInfo: '다음 셔틀버스 시간표 확인 중...',
          isGiheungShuttle: true  // Flag to identify this as Giheung shuttle
        });
      }

      if (shuttleData.routes.everline) {
        const title = direction === 'fromMJUtoGH' ? '명지대역 셔틀버스 + 에버라인' : '에버라인 + 명지대역 셔틀버스';
        let time = 0;
        
        if (direction === 'fromMJUtoGH' && typeof shuttleData.routes.everline.connection === 'number') {
          time = shuttleData.routes.everline.connection;
        } else if (typeof shuttleData.routes.everline.time === 'number') {
          time = shuttleData.routes.everline.time;
        }
        
        const additionalInfo = direction === 'fromMJUtoGH' 
          ? `에버라인 ${formatTime(shuttleData.routes.everline.time || 0)}`
          : `명지대역 셔틀 ${formatTime(shuttleData.routes.everline.connection || 0)}`;

        cards.push({
          type: 'shuttle',
          time: time,
          title: title,
          subtitle: formatTime(time),
          additionalInfo: additionalInfo
        });
      }
    }
    
    const sortedCards = cards.sort((a, b) => a.time - b.time);
    return sortedCards;
  };

  const getMedalEmoji = (index: number) => {
    switch(index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };

  // 버스번호에 따른 상세 정보 가져오기
  const getBusDetailInfo = (busNumber: string) => {
    const info = busDetailInfo[busNumber];
    if (!info) return <div>버스 정보가 없습니다.</div>;
    
    return (
      <div className={styles.busDetailContainer}>
        <div className={styles.busDetailTitle}>{busNumber}번 버스</div>
        <div className={styles.busDetailContent}>
          {Object.entries(info).map(([key, value]) => {
            // 소요시간은 방향에 따라 다르게 표시
            if (key === '소요시간' && typeof value === 'object') {
              return (
                <div key={key} className={styles.busDetailRow}>
                  <span className={styles.busDetailLabel}>{key}</span>
                  <span className={styles.busDetailValue}>{value[direction]}</span>
                </div>
              );
            }
            
            // 그 외 정보는 그대로 표시
            return (
              <div key={key} className={styles.busDetailRow}>
                <span className={styles.busDetailLabel}>{key}</span>
                <span className={styles.busDetailValue}>{value as string}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className={`${styles.container} ${direction === 'fromMJUtoGH' ? styles.yellowTheme : styles.blueTheme} ${darkMode ? styles.darkMode : ''}`}>
      <div className={styles.timeDisplay}>
        <span className={styles.period}>{currentTime.period}</span>
        <span className={styles.time}>{currentTime.time}</span>
      </div>
      
      <div className={styles.toggleWrapper}>
        <button 
          className={`${styles.toggleButton} ${direction === 'fromMJUtoGH' ? styles.active : ''}`}
          onClick={() => setDirection('fromMJUtoGH')}
        >
          기흥역
        </button>
        <button 
          className={`${styles.toggleButton} ${direction === 'fromGHtoMJU' ? styles.active : ''}`}
          onClick={() => setDirection('fromGHtoMJU')}
        >
          명지대
        </button>
      </div>
      


      {/* 에러 메시지 표시 */}
      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* 운행 시간 외 또는 주말 메시지 표시 */}
      {shuttleData?.message && (
        <div className={styles.notice}>{shuttleData.message}</div>
      )}

      <div className={styles.busContainer}>
        {/* 정렬된 교통수단 카드 표시 */}
        {!error && !shuttleData?.message && (
          <>
            {convertToTransportCard(busData).map((transport, index) => (
              <div 
                key={index} 
                className={`${styles.busCard} ${flippedCards[index] ? styles.flipped : ''}`}
                onClick={(e) => {
                  // Don't flip if clicking on the button
                  if (e.target instanceof HTMLButtonElement) {
                    return;
                  }
                  handleCardFlip(index);
                }}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFront}>
                    <div className={`${styles.busNumber} ${transport.title && (transport.title.includes('에버라인 + 명지대역') || transport.title.includes('명지대역 셔틀버스 + 에버라인')) ? styles.longBusTitle : ''}`}>
                      {index < 3 && <span className={styles.medal}>{getMedalEmoji(index)}</span>}
                      {transport.type === 'bus' ? (
                        <BusIcon busNumber={transport.title || ""} className={styles.busIcon} />
                      ) : (
                        <BusIcon busNumber="" className={styles.busIcon} />
                      )}
                      {transport.title || "정보 없음"}
                    </div>
                    <div className={styles.busInfo}>
                      <div className={styles.arrivalTime}>
                        <span>출발까지</span>
                        <strong>{transport.subtitle || "-"}</strong>
                      </div>
                      {transport.isGiheungShuttle ? (
                        <button
                          className={styles.boardingButton}
                          onClick={() => handleBoardingReport(index)}
                          disabled={!isLoggedIn || isSubmitting || !canSubmit}
                        >
                          {isSubmitting && submittingCardIndex === index ? '제출중...' : !canSubmit ? '탑승완료' : '탑승했어요'}
                        </button>
                      ) : transport.additionalInfo && (
                        <div className={styles.seats}>{transport.additionalInfo}</div>
                      )}
                    </div>
                    {submitFeedback && submittingCardIndex === index && (
                      <div className={`${styles.feedbackMessage} ${!isLoggedIn ? styles.errorFeedback : styles.successFeedback}`}>
                        {submitFeedback}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardBack}>
                    <div className={styles.nextBusInfo}>
                      {transport.type === 'bus' && transport.title
                        ? getBusDetailInfo(transport.title) 
                        : <div className={styles.shuttleDetailInfo}>
                            <div className={styles.busDetailTitle}>{transport.title || "정보 없음"}</div>
                            <div className={styles.shuttleDetailValue}>
                              {transport.additionalInfo || "정보 없음"}
                            </div>
                          </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}