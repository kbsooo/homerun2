'use client';
import React, { useState, useEffect } from 'react';
import styles from './Main.module.css';
import { useThemeContext } from '../context/ThemeContext';

interface BusInfo {
  도착시간: string;
  버스번호: string;
  남은좌석수: string;
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

export default function Main() {
  const [busData, setBusData] = useState<BusInfo[]>([]);
  const [shuttleData, setShuttleData] = useState<ShuttleInfo | null>(null);
  const [currentTime, setCurrentTime] = useState({
    time: "",
    period: ""
  });
  const [error, setError] = useState<string | null>(null);
  const { theme, darkMode, direction, setDirection } = useThemeContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 현재 시간 체크
        const now = new Date();
        const day = now.getDay(); // 0: 일요일, 6: 토요일
        const hour = now.getHours();
        const isWeekend = day === 0 || day === 6;
        const isOperatingHours = hour >= 6 && hour < 23; // 운행 시간: 06:00 ~ 23:00

        // 운행 시간 외 처리
        if (!isOperatingHours) {
          setBusData([]);
          setShuttleData({ message: '버스 운행 시간이 아닙니다. (운행 시간: 06:00 ~ 23:00)' });
          setError(null);
          return;
        }

        // 주말 처리
        if (isWeekend) {
          setShuttleData({ message: '주말에는 셔틀버스가 운행하지 않습니다.' });
        }

        // 버스 데이터 가져오기
        const busEndpoint = direction === 'fromMJUtoGH' ? 'http://localhost:8080/bus/fromMJUtoGH' : 'http://localhost:8080/bus/fromGHtoMJU';
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
            setBusData(busData);
            setError(null);
          } else {
            setBusData([]);
            setError('버스 정보를 불러올 수 없습니다.');
          }
        } catch (error) {
          console.error('버스 정보 조회 실패:', error);
          setBusData([]);
          setError('버스 정보를 불러올 수 없습니다.');
        }

        // 주말이 아닐 때만 셔틀 데이터 가져오기
        if (!isWeekend) {
          try {
            const shuttleEndpoint = `http://localhost:8080/api/shuttle/${direction}`;
            const shuttleResponse = await fetch(shuttleEndpoint);
            
            if (shuttleResponse.ok) {
              const shuttleData = await shuttleResponse.json();
              setShuttleData(shuttleData);
            } else {
              setShuttleData(null);
            }
          } catch (error) {
            console.error('셔틀 정보 조회 실패:', error);
            setShuttleData(null);
          }
        }
      } catch (error) {
        console.error('데이터를 불러오는데 실패했습니다:', error);
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

  return (
    <main className={`
      ${styles.container} 
      ${direction === 'fromMJUtoGH' ? styles.yellowTheme : styles.blueTheme}
      ${darkMode ? styles.darkMode : ''}
    `}>
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
        {/* 셔틀 정보를 버스 카드 형식으로 표시 */}
        {!shuttleData?.message && shuttleData?.routes && (
          <>
            {/* 기흥역 셔틀 */}
            {shuttleData.routes.giheung && (
              <div className={styles.busCard}>
                <div className={styles.busNumber}>기흥역 셔틀버스</div>
                <div className={styles.busInfo}>
                  <div className={styles.arrivalTime}>
                    <span>출발까지</span>
                    <strong>{formatTime(shuttleData.routes.giheung.time)}</strong>
                  </div>
                </div>
              </div>
            )}
            
            {/* 에버라인 + 명지대역 셔틀 또는 명지대역 셔틀 + 에버라인 */}
            {shuttleData.routes.everline && (
              <div className={styles.busCard}>
                <div className={styles.busNumber}>
                  {direction === 'fromMJUtoGH' ? '명지대역 셔틀버스 + 에버라인' : '에버라인 + 명지대역 셔틀버스'}
                </div>
                <div className={styles.busInfo}>
                  <div className={styles.arrivalTime}>
                    {direction === 'fromMJUtoGH' ? (
                      <>
                        <span>명지대역 셔틀 출발까지</span>
                        <strong>{formatTime(shuttleData.routes.everline.connection)}</strong>
                      </>
                    ) : (
                      <>
                        <span>에버라인 출발까지</span>
                        <strong>{formatTime(shuttleData.routes.everline.time)}</strong>
                      </>
                    )}
                  </div>
                  <div className={styles.seats}>
                    {direction === 'fromMJUtoGH' ? (
                      <>에버라인 {formatTime(shuttleData.routes.everline.time)}</>
                    ) : (
                      <>명지대역 셔틀 {formatTime(shuttleData.routes.everline.connection)}</>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 일반 버스 정보 표시 */}
        {busData.length > 0 && busData.map((bus, index) => (
          <div key={index} className={styles.busCard}>
            <div className={styles.busNumber}>{bus.버스번호}</div>
            <div className={styles.busInfo}>
              <div className={styles.arrivalTime}>
                <span>출발까지</span>
                <strong>{bus.도착시간}분</strong>
              </div>
              <div className={styles.seats}>{bus.남은좌석수}</div>
            </div>
          </div>
        ))}

        {/* 데이터가 없을 때 메시지 표시 */}
        {!error && !shuttleData?.message && busData.length === 0 && !shuttleData?.routes && (
          <div className={styles.notice}>운행 중인 버스가 없습니다.</div>
        )}
      </div>
    </main>
  );
}