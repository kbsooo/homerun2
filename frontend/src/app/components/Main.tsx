'use client';
import React, { useState, useEffect } from 'react';
import styles from './Main.module.css';
import { useThemeContext } from '../context/ThemeContext';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 현재 시간 체크
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const isWeekend = day === 0 || day === 6;
        const isOperatingHours = hour >= 6 && hour < 23;

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
        const busEndpoint = direction === 'fromMJUtoGH' 
          ? `/bus/fromMJUtoGH` 
          : `/bus/fromGHtoMJU`;
        
        try {
          const busResponse = await fetch(busEndpoint, {
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
            // 상대 경로로 API 호출
            const shuttleEndpoint = `/api/shuttle/${direction}`;
            const shuttleResponse = await fetch(shuttleEndpoint);
            
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

  const convertToTransportCard = (data: BusInfo[] | ShuttleInfo | null): TransportCard[] => {
    const cards: TransportCard[] = [];

    // Add bus data
    if (data && Array.isArray(data)) {
      data.forEach((bus) => {
        cards.push({
          type: 'bus',
          time: parseInt(bus.도착시간),
          title: bus.버스번호,
          subtitle: `${bus.도착시간}분`,
          additionalInfo: bus.남은좌석수
        });
      });
    }

    // Add shuttle data
    if (shuttleData?.routes) {
      if (shuttleData.routes.giheung) {
        cards.push({
          type: 'shuttle',
          time: shuttleData.routes.giheung.time,
          title: '기흥역 셔틀버스',
          subtitle: formatTime(shuttleData.routes.giheung.time),
          additionalInfo: '다음 셔틀버스 시간표 확인 중...'
        });
      }

      if (shuttleData.routes.everline) {
        const title = direction === 'fromMJUtoGH' ? '명지대역 셔틀버스 + 에버라인' : '에버라인 + 명지대역 셔틀버스';
        const time = direction === 'fromMJUtoGH' ? shuttleData.routes.everline.connection : shuttleData.routes.everline.time;
        const additionalInfo = direction === 'fromMJUtoGH' 
          ? `에버라인 ${formatTime(shuttleData.routes.everline.time)}`
          : `명지대역 셔틀 ${formatTime(shuttleData.routes.everline.connection)}`;

        cards.push({
          type: 'shuttle',
          time: time,
          title: title,
          subtitle: formatTime(time),
          additionalInfo: additionalInfo
        });
      }
    }

    return cards.sort((a, b) => a.time - b.time);
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
                onClick={() => handleCardFlip(index)}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardFront}>
                    <div className={`${styles.busNumber} ${transport.title.includes('에버라인 + 명지대역') || transport.title.includes('명지대역 셔틀버스 + 에버라인') ? styles.longBusTitle : ''}`}>
                      {index < 3 && <span className={styles.medal}>{getMedalEmoji(index)}</span>}
                      {transport.type === 'bus' ? (
                        <BusIcon busNumber={transport.title} className={styles.busIcon} />
                      ) : (
                        <BusIcon busNumber="" className={styles.busIcon} />
                      )}
                      {transport.title}
                    </div>
                    <div className={styles.busInfo}>
                      <div className={styles.arrivalTime}>
                        <span>출발까지</span>
                        <strong>{transport.subtitle}</strong>
                      </div>
                      {transport.additionalInfo && (
                        <div className={styles.seats}>{transport.additionalInfo}</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardBack}>
                    <div className={styles.nextBusInfo}>
                      {transport.type === 'bus' 
                        ? getBusDetailInfo(transport.title) 
                        : <div className={styles.shuttleDetailInfo}>
                            <div className={styles.busDetailTitle}>{transport.title}</div>
                            <div className={styles.shuttleDetailValue}>
                              {transport.additionalInfo}
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

        {/* 데이터가 없을 때 메시지 표시 */}
        {!error && !shuttleData?.message && busData.length === 0 && !shuttleData?.routes && (
          <div className={styles.notice}>운행 중인 버스가 없습니다.</div>
        )}
      </div>

      <div className={styles.disclaimer}>
        ※ 이 정보는 실제와 차이가 있을 수 있습니다.
      </div>
    </main>
  );
}