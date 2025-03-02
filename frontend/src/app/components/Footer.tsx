// app/components/Footer.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';
import FeedbackModal from './FeedbackModal';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setModalKey(prev => prev + 1);
  };
  
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
            <span> · </span>
            <span 
              onClick={openModal}
              className={styles.link}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openModal()}
            >
              피드백
            </span>
          </div>
        </div>
        <div className={styles.copyright}>
          © {currentYear} KBSOO. All rights reserved.
        </div>
      </div>
      
      <FeedbackModal key={modalKey} isOpen={isModalOpen} onClose={closeModal} />
    </footer>
  );
}