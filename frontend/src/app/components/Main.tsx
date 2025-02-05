'use client';
import React, { useState, useEffect } from 'react';
import styles from './Main.module.css';

interface BusInfo {
  도착시간: string;
  버스번호: string;
  남은좌석수: string;
}

interface ShuttleInfo {
  nextShuttle: string;
  time: number;
  giheungTime: number;
  mjuStationTime: number;
  everlineTime: number;
  message?: string;
}

type Direction = 'fromMJUtoGH' | 'fromGHtoMJU';

interface MainProps {
  isDarkMode: boolean;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
}

export default function Main({ isDarkMode, direction, onDirectionChange }: MainProps) {
  const [busData, setBusData] = useState<BusInfo[]>([]);
  const [shuttleData, setShuttleData] = useState<ShuttleInfo | null>(null);
  const [currentTime, setCurrentTime] = useState({
    time: "",
    period: ""
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 버스 데이터 가져오기
        const busResponse = await fetch(`/api/bus?direction=${direction}`);
        if (!busResponse.ok) {
          throw new Error('버스 정보를 불러오는데 실패했습니다.');
        }
        const busData = await busResponse.json();
        if (busData.error) {
          setError(busData.error);
        } else {
          setBusData(busData);
        }

        // 셔틀 데이터 가져오기
        const shuttleResponse = await fetch(`/api/shuttle/${direction}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const shuttleData = await shuttleResponse.json();
        setShuttleData(shuttleData);
        setError(null);
      } catch (error) {
        console.error('데이터를 불러오는데 실패했습니다:', error);
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
      ${isDarkMode ? styles.darkMode : ''}
    `}>
      <div className={styles.timeDisplay}>
        <span className={styles.period}>{currentTime.period}</span>
        <span className={styles.time}>{currentTime.time}</span>
      </div>
      
      <div className={styles.toggleWrapper}>
        <button 
          className={`${styles.toggleButton} ${direction === 'fromMJUtoGH' ? styles.active : ''}`} 
          onClick={() => onDirectionChange('fromMJUtoGH')}
        >
          기흥역
        </button>
        <button 
          className={`${styles.toggleButton} ${direction === 'fromGHtoMJU' ? styles.active : ''}`}
          onClick={() => onDirectionChange('fromGHtoMJU')}
        >
          명지대
        </button>
      </div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          {/* 셔틀 정보 표시 */}
          <div className={styles.shuttleContainer}>
            <div className={`${styles.shuttleCard} ${shuttleData?.message ? styles.disabled : ''}`}>
              <h2>다음 셔틀</h2>
              <div className={styles.shuttleInfo}>
                {shuttleData?.message ? (
                  <div className={styles.noShuttle}>
                    <span className={styles.noShuttleMessage}>{shuttleData.message}</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.nextShuttle}>
                      <span>{shuttleData?.nextShuttle}</span>
                      <strong>{shuttleData?.time ? formatTime(shuttleData.time) : '-'}</strong>
                    </div>
                    <div className={styles.otherTimes}>
                      <div>기흥역 셔틀: {shuttleData?.giheungTime ? formatTime(shuttleData.giheungTime) : '-'}</div>
                      <div>명지대역 셔틀: {shuttleData?.mjuStationTime ? formatTime(shuttleData.mjuStationTime) : '-'}</div>
                      <div>에버라인: {shuttleData?.everlineTime ? formatTime(shuttleData.everlineTime) : '-'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 버스 정보 표시 */}
          <div className={styles.busContainer}>
            {busData.map((bus, index) => (
              <div key={index} className={styles.busCard}>
                <div className={styles.busNumber}>{bus.버스번호}</div>
                <div className={styles.busInfo}>
                  <div className={styles.arrivalTime}>
                    <span>도착까지</span>
                    <strong>{bus.도착시간}분</strong>
                  </div>
                  <div className={styles.seats}>{bus.남은좌석수}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}