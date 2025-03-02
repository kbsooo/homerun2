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
          <div className={styles.mainFooter}>
            <div className={styles.copyrightContainer}>
              <div className={styles.copyright}>
                © {currentYear} <Link
                  href="https://github.com/kbsooo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  KBSOO
                </Link>. All rights reserved.
              </div>
              
              <div className={styles.attribution}>
                <Link
                  href="https://github.com/kbsooo/homerun2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.attributionLink}
                >
                  this project
                </Link> is based on <Link
                  href="https://github.com/ijodea/homerun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.attributionLink}
                >
                  ijodea/homerun
                </Link>
              </div>
            </div>

            <span 
              onClick={openModal}
              className={styles.feedbackLink}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openModal()}
              aria-label="피드백 보내기"
            >
              피드백
            </span>
          </div>
        </div>
      </div>
      
      <FeedbackModal key={modalKey} isOpen={isModalOpen} onClose={closeModal} />
    </footer>
  );
}