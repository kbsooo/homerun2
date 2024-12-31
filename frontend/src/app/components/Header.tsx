// app/components/Header.tsx
import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Footer() {
  return (
    <header>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href='/'>Home</Link>
          </li>
          <li>
            <Link href='/chat'>Chat</Link>
          </li>
          <li>
            <Link href='/detail/ghtomju'>detail/ghtomju</Link>
          </li>
          <li>
            <Link href='detail/mjutogh'>detail/mjutogh</Link>
          </li>
          <li>
            <Link href='/taxi'>Taxi</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}