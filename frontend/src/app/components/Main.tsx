'use client';
import React, { useState, useEffect } from 'react';
import styles from './Main.module.css';

interface BusInfo {
  도착시간: string;
  버스번호: string;
  남은좌석수: string;
}

type Direction = 'fromMJUtoGH' | 'fromGHtoMJU';

export default function Main() {
  const [busData, setBusData] = useState<BusInfo[]>([]);
  const [timer, setTimer] = useState("00:00:00");
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('fromMJUtoGH');

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
    const interval = setInterval(fetchBusData, 60000); // 1분마다 갱신

    return () => clearInterval(interval);
  }, [direction]);

  useEffect(() => {
    const updateTimer = () => {
      const date = new Date();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      setTimer(`${hours}:${minutes}:${seconds}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleDirection = () => {
    setDirection(prev => prev === 'fromMJUtoGH' ? 'fromGHtoMJU' : 'fromMJUtoGH');
  };

  const getDirectionText = () => {
    return direction === 'fromMJUtoGH' ? '명지대 → 기흥역' : '기흥역 → 명지대';
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.timer}>{timer}</h1>
      <button onClick={toggleDirection} className={styles.directionButton}>
        {getDirectionText()}
      </button>
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