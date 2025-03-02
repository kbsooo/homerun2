import React, { useEffect, useRef } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import styles from './FeedbackModal.module.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [state, handleSubmit] = useForm("mvgzebgz");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 모달 외부 클릭 시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // ESC 키 누를 시 닫기
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // 모달이 닫혀있을 때는 렌더링하지 않음
  if (!isOpen) return null;

  if (state.succeeded) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} ref={modalRef}>
          <div className={styles.modalHeader}>
            <h2>감사합니다!</h2>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.successMessage}>피드백이 성공적으로 제출되었습니다.</p>
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.closeModalButton} onClick={onClose}>닫기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h2>피드백 보내기</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">이메일 주소</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your-email@example.com"
                required
              />
              <ValidationError prefix="이메일" field="email" errors={state.errors} />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="message">피드백 내용</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="개선사항이나 의견을 자유롭게 작성해주세요."
                required
              />
              <ValidationError prefix="메시지" field="message" errors={state.errors} />
            </div>
            
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                취소
              </button>
              <button type="submit" className={styles.submitButton} disabled={state.submitting}>
                {state.submitting ? '제출 중...' : '제출하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal; 