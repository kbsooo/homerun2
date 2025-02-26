'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Animation duration
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  if (!isMounted) return null;

  return createPortal(
    <div className={`${styles.toastContainer} ${styles[type]} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeButton} onClick={handleClose}>
        ✕
      </button>
    </div>,
    document.body
  );
}

// Toast manager for multiple toasts
type ToastOptions = Omit<ToastProps, 'message'>;

let toastId = 0;

interface ToastItem extends ToastProps {
  id: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, options?: ToastOptions) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, ...options }]);
    return id;
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const ToastContainer = useCallback(() => {
    if (!toasts.length) return null;
    
    if (typeof window !== 'undefined') {
      return createPortal(
        <div className={styles.toastsWrapper}>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      );
    }
    
    return null;
  }, [toasts, removeToast]);

  return { addToast, removeToast, ToastContainer };
} 