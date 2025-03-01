// app/components/Header.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import { useThemeContext } from '../context/ThemeContext';
import { usePathname } from 'next/navigation';
import { useChat } from '../context/ChatContext';

interface UserInfo {
  nickname: string;
  profileImage: string;
}

export default function Header() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { darkMode, toggleDarkMode } = useThemeContext();
  const pathname = usePathname();
  const { setMinimizedChatId, setIsMinimized } = useChat();

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
    const error = urlParams.get('error');
    
    if (loginData) {
      try {
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
          
          // 로그인 성공 메시지 표시
          alert(`${data.nickname}님, 환영합니다!`);
          
          // 로그인 데이터를 URL에서 제거
          window.history.replaceState({}, document.title, '/');
        }
      } catch (e) {
        console.error('로그인 데이터 파싱 오류:', e);
      }
    }
    
    // 에러 파라미터가 있는 경우 처리
    if (error) {
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      const status = urlParams.get('status');
      const message = urlParams.get('message');
      
      if (error === 'backend_error' && status) {
        errorMessage = `백엔드 서버 오류 (${status}): 관리자에게 문의하세요.`;
      } else if (error === 'connection_error') {
        errorMessage = `서버 연결 오류: ${message || '서버에 연결할 수 없습니다'}`;
      } else if (error === 'no_code') {
        errorMessage = '카카오 인증 코드가 없습니다. 다시 시도해주세요.';
      } else if (error === 'internal_error') {
        errorMessage = `서버 내부 오류: ${message || '알 수 없는 오류'}`;
      }
      
      console.error('로그인 오류:', error, message);
      alert(errorMessage);
      
      // 에러 파라미터를 URL에서 제거
      window.history.replaceState({}, document.title, '/');
    }

    // 카카오 인증 코드 처리는 이제 API 라우트에서 자동으로 처리됨
    // 아래 코드 삭제 (더 이상 필요 없음)
    // const code = urlParams.get('code');
    // if (code) {
    //   handleKakaoCallback(code);
    // }
  }, [pathname]);

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
    try {
      const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
      if (!KAKAO_CLIENT_ID) {
        console.error('KAKAO_CLIENT_ID가 설정되지 않았습니다');
        alert('카카오 로그인 설정 오류가 발생했습니다.');
        return;
      }
      
      // 백엔드 서버의 콜백 URI를 사용 (프론트엔드가 아닌)
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const REDIRECT_URI = encodeURIComponent(`${BACKEND_URL}/api/auth/kakao/callback`);
      const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
      
      console.log('카카오 로그인 시도, 리다이렉트 URI:', `${BACKEND_URL}/api/auth/kakao/callback`);
      
      // 직접 리다이렉트 방식으로 카카오 로그인
      console.log('직접 리다이렉트 방식으로 카카오 로그인 시도...');
      window.location.href = kakaoURL;
      
    } catch (loginError) {
      console.error('로그인 시도 중 오류:', loginError);
      alert('로그인 처리 중 오류가 발생했습니다.');
    }
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

  const handleLogoClick = () => {
    if (pathname.startsWith('/chat/')) {
      const chatId = pathname.split('/').pop();
      if (chatId) {
        setMinimizedChatId(chatId);
        setIsMinimized(true);
      }
    }
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Link href='/' className={styles.logoLink} onClick={handleLogoClick}>
            <div className={styles.logoContent}>
              <span className={styles.logoText}>HOMERUN</span>
              <span className={styles.betaLabel}>beta</span>
            </div>
          </Link>
        </div>
        <div className={styles.menuContainer}>
          <ul className={styles.menu}>
            <li className={styles.menuListItem}>
              <button 
                className={styles.menuItem}
                onClick={() => {
                  // alert('개발중입니다. 조금만 기다려주세요!');
                  window.location.href = '/taxi';
                }}
              >
                택시 모집
              </button>
            </li>
            <li className={styles.menuListItem}>
              {userInfo ? (
                <div className={styles.dropdown} ref={dropdownRef}>
                  <button onClick={toggleDropdown} className={styles.menuItem}>
                    {userInfo.nickname}님
                  </button>
                  <div className={`${styles.dropdownContent} ${isDropdownOpen ? styles.show : ''}`}>
                    {/* <Link 
                      href='/mypage' 
                      className={styles.dropdownItem}
                      onClick={() => {
                        if (pathname.startsWith('/chat/')) {
                          const chatId = pathname.split('/').pop();
                          if (chatId) {
                            setMinimizedChatId(chatId);
                            setIsMinimized(true);
                          }
                        }
                        setIsDropdownOpen(false);
                      }}
                    >
                      마이페이지
                    </Link> */}
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
                  className={`${styles.toggleButton} ${!darkMode ? styles.active : ''}`}
                  onClick={() => toggleDarkMode(false)}
                  aria-label="라이트 모드"
                >
                  ☀︎
                </button>
                <button 
                  className={`${styles.toggleButton} ${darkMode ? styles.active : ''}`}
                  onClick={() => toggleDarkMode(true)}
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