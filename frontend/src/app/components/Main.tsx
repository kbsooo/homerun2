'use client';
import React, { useState, useEffect } from 'react';
import styles from './Main.module.css';

interface BusInfo {
  도착시간: string;
  버스번호: string;
  남은좌석수: string;
}

type Direction = 'fromMJUtoGH' | 'fromGHtoMJU';

interface MainProps {
  isDarkMode: boolean;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
}

export default function Main({ isDarkMode, direction, onDirectionChange }: MainProps) {
  const [busData, setBusData] = useState<BusInfo[]>([]);
  const [currentTime, setCurrentTime] = useState({
    time: "",
    period: ""
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        const response = await fetch(`/api/bus?direction=${direction}`);
        if (!response.ok) {
          throw new Error('서버 응답이 올바르지 않습니다.');
        }
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setBusData(data);
          setError(null);
        }
      } catch (error) {
        console.error('버스 정보를 불러오는데 실패했습니다:', error);
        setError('버스 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    };

    fetchBusData();
    const interval = setInterval(fetchBusData, 60000);

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
      )}
    </main>
  );
}