// app/components/Footer.tsx
import React from 'react';
import Link from 'next/link';
// import { Github } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <span className={styles.span}>
            based on 
            <Link href="https://github.com/ijodea/homerun" target="_blank"
            rel="noopener noreferrer"
              className={styles.link}>
              ijodea/homerun
            </Link>
            , remade by
            <Link href="https://github.com/kbsooo"
            target='_blank'
            rel="noopener noreferrer"
            className={styles.link}
          >
            KBSOO
          </Link>
          </span>
        </div>
        <div className={styles.copyright}>
        © {new Date().getFullYear()} kbsoo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}