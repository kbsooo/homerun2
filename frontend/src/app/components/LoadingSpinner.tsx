'use client';

import { memo } from 'react';
import styles from './LoadingSpinner.module.css';
import { FaTaxi } from 'react-icons/fa';

interface LoadingSpinnerProps {
    message?: string;
    className?: string;
    isModal?: boolean;
}

const LoadingSpinner = memo(({ 
    message = '모집중...', 
    className = '',
    isModal = false
}: LoadingSpinnerProps) => {
    const containerClass = isModal ? `${styles.loadingContainer} ${styles.modalContainer} ${className}`.trim() : 
                                  `${styles.loadingContainer} ${className}`.trim();
    
    return (
        <>
            {isModal && <div className={styles.modalOverlay} />}
            <div className={containerClass}>
                <div className={styles.loadingAnimation} role="status" aria-label="로딩중">
                    <div className={styles.road}>
                        <div className={styles.roadLine}></div>
                    </div>
                    <div className={styles.taxi}>
                        <FaTaxi size={24} />
                    </div>
                </div>
                <p className={styles.message}>{message}</p>
            </div>
        </>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 