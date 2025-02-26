// app/components/Footer.tsx
import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.credits}>
            <span>Based on </span>
            <Link
              href="https://github.com/ijodea/homerun"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              ijodea/homerun
            </Link>
            <span>, Remade by </span>
            <Link
              href="https://github.com/kbsooo"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              KBSOO
            </Link>
          </div>
        </div>
        <div className={styles.copyright}>
          © {currentYear} KBSOO. All rights reserved.
        </div>
      </div>
    </footer>
  );
}