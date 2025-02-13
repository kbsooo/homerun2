'use client';

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner = ({ message = '모집중...' }: LoadingSpinnerProps) => {
    return (
        <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.message}>{message}</p>
        </div>
    );
};

export default LoadingSpinner; 