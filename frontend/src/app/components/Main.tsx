'use client';
import React, { useState } from 'react';
import styles from './Main.module.css';

export default function Main() { 

  const [timer, setTimer] = useState("00:00:00");

  const currentTimer = () => { 
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const secods = String(date.getSeconds()).padStart(2, "0");
    setTimer(`${hours}:${minutes}:${secods}`);
  }

  const startTimer = () => { setInterval(currentTimer, 1000); }
  startTimer();

  return (
    <main>
      <h1 className={styles.timer}>{timer}</h1>
    </main>
  )
}