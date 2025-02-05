// app/components/Header.tsx
import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
}

export default function Header({ isDarkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Link href='/' className={styles.logoLink}>
            HomeRun
          </Link>
        </div>
        <div className={styles.menuContainer}>
          <ul className={styles.menu}>
            <li>
              <Link href='/' className={styles.menuItem}>홈</Link>
            </li>
            <li>
              <Link href='/chat' className={styles.menuItem}>채팅</Link>
            </li>
            <li>
              <Link href='/taxi' className={styles.menuItem}>택시</Link>
            </li>
          </ul>
          <div className={styles.toggleWrapper}>
            <button 
              className={`${styles.toggleButton} ${!isDarkMode ? styles.active : ''}`}
              onClick={() => onToggleDarkMode(false)}
            >
              라이트
            </button>
            <button 
              className={`${styles.toggleButton} ${isDarkMode ? styles.active : ''}`}
              onClick={() => onToggleDarkMode(true)}
            >
              다크
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}