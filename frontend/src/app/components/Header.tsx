// app/components/Header.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
}

interface UserInfo {
  nickname: string;
  profileImage: string;
}

export default function Header({ isDarkMode, onToggleDarkMode }: HeaderProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    const savedUserInfo = localStorage.getItem('userInfo');
    if (token && savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
    }

    // URL의 쿼리 파라미터에서 로그인 데이터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const loginData = urlParams.get('loginData');
    
    if (loginData) {
      const data = JSON.parse(decodeURIComponent(loginData));
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify({
          nickname: data.nickname,
          profileImage: data.profileImage
        }));
        setUserInfo({
          nickname: data.nickname,
          profileImage: data.profileImage
        });
        
        // 로그인 데이터를 URL에서 제거
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = () => {
    const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const REDIRECT_URI = encodeURIComponent('http://localhost:8080/api/auth/kakao/callback');
    const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    
    // 새 창에서 카카오 로그인 페이지 열기
    const popup = window.open(kakaoURL, 'kakao-login', 'width=600,height=800');
    
    // 팝업 창에서 메시지 수신
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:8080') return;
      
      const { token, nickname, profileImage } = event.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify({ nickname, profileImage }));
        setUserInfo({ nickname, profileImage });
        popup?.close();
        // 이벤트 리스너 제거
        window.removeEventListener('message', messageHandler);
      }
    };
    
    window.addEventListener('message', messageHandler);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Link href='/' className={styles.logoLink}>
            HOMERUN
          </Link>
        </div>
        <div className={styles.menuContainer}>
          <ul className={styles.menu}>
            <li className={styles.menuListItem}>
              <Link href='/taxi' className={styles.menuItem}>택시 모집</Link>
            </li>
            <li className={styles.menuListItem}>
              {userInfo ? (
                <div className={styles.dropdown} ref={dropdownRef}>
                  <button onClick={toggleDropdown} className={styles.menuItem}>
                    {userInfo.nickname}님
                  </button>
                  <div className={`${styles.dropdownContent} ${isDropdownOpen ? styles.show : ''}`}>
                    <Link href='/mypage' className={styles.dropdownItem}>
                      마이페이지
                    </Link>
                    <button onClick={handleLogout} className={styles.dropdownItem}>
                      로그아웃
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={handleLogin} className={styles.menuItem}>
                  로그인
                </button>
              )}
            </li>
            <li className={styles.menuListItem}>
              <div className={styles.toggleWrapper}>
                <button 
                  className={`${styles.toggleButton} ${!isDarkMode ? styles.active : ''}`}
                  onClick={() => onToggleDarkMode(false)}
                  aria-label="라이트 모드"
                >
                  ☀︎
                </button>
                <button 
                  className={`${styles.toggleButton} ${isDarkMode ? styles.active : ''}`}
                  onClick={() => onToggleDarkMode(true)}
                  aria-label="다크 모드"
                >
                  ☾
                </button>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}