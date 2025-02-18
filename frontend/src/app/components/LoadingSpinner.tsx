'use client';

import { memo } from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    message?: string;
    className?: string;
}

const LoadingSpinner = memo(({ 
    message = '모집중...', 
    className = '' 
}: LoadingSpinnerProps) => {
    return (
        <div className={`${styles.loadingContainer} ${className}`.trim()}>
            <div className={styles.loadingAnimation} role="status" aria-label="로딩중">
                <div className={styles.square} />
                <div className={styles.square} />
                <div className={styles.square} />
                <div className={styles.square} />
            </div>
            <p className={styles.message}>{message}</p>
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 