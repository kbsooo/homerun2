'use client';
import React from "react";
import Header from "../app/components/Header";
import Main from "../app/components/Main";
import Footer from "../app/components/Footer";
import styles from './page.module.css';
import { useThemeContext } from '../app/context/ThemeContext';

export default function Home() {
  const { theme, darkMode } = useThemeContext();

  return (
    <div className={`${styles.wrapper} ${theme} ${darkMode ? 'darkMode' : ''}`}>
      <Header />
      <main className={styles.main}>
        <Main />
      </main>
      <Footer />
    </div>
  );
}
