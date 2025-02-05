'use client';
import React, { useState, useEffect } from "react";
import Header from "../app/components/Header";
import Main from "../app/components/Main";
import Footer from "../app/components/Footer";
import styles from './page.module.css';

type Direction = 'fromMJUtoGH' | 'fromGHtoMJU';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [direction, setDirection] = useState<Direction>('fromMJUtoGH');

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);

    // Listen for system dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply dark mode class to HTML element
    if (isDarkMode) {
      document.documentElement.classList.add('darkMode');
    } else {
      document.documentElement.classList.remove('darkMode');
    }
  }, [isDarkMode]);

  const getThemeClass = () => {
    const themeClass = direction === 'fromMJUtoGH' ? styles.yellowTheme : styles.blueTheme;
    const darkClass = isDarkMode ? styles.darkMode : '';
    return `${styles.wrapper} ${themeClass} ${darkClass}`;
  };

  return (
    <div className={getThemeClass()}>
      <Header isDarkMode={isDarkMode} onToggleDarkMode={setIsDarkMode} />
      <main className={styles.main}>
        <Main 
          isDarkMode={isDarkMode} 
          direction={direction}
          onDirectionChange={setDirection}
        />
      </main>
      <Footer />
    </div>
  );
}
