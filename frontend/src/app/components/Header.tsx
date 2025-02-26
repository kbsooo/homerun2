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

    // 카카오 인증 코드 처리
    const code = urlParams.get('code');
    if (code) {
      handleKakaoCallback(code);
    }
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

  // 카카오 인증 코드 백엔드로 전송하는 함수
  const handleKakaoCallback = async (code: string) => {
    try {
      console.log('카카오 인증 코드 처리 시작');
      
      // HTTPS 프록시 또는 보안 연결 사용
      // 백엔드 URL이 HTTP인 경우 프론트에서 직접 처리
      const response = await fetch(`/api/auth/kakao/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('로그인 응답 오류:', response.status, errorText);
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('로그인 응답 받음:', { hasToken: !!data.token });
      
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
        
        // 인증 코드를 URL에서 제거
        window.history.replaceState({}, document.title, '/');
        console.log('로그인 성공, 사용자 정보 저장됨');
      } else {
        console.error('로그인 응답에 토큰이 없음');
        throw new Error('Login response missing token');
      }
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      // 로그인 실패 시 알림 처리
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleLogin = () => {
    try {
      const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
      if (!KAKAO_CLIENT_ID) {
        console.error('KAKAO_CLIENT_ID가 설정되지 않았습니다');
        alert('카카오 로그인 설정 오류가 발생했습니다.');
        return;
      }
      
      // 현재 프론트엔드 도메인으로 리다이렉트 설정 (중요! 사이트 도메인과 일치해야 함)
      const REDIRECT_URI = encodeURIComponent(window.location.origin);
      const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
      
      console.log('카카오 로그인 시도, 리다이렉트 URI:', window.location.origin);
      
      // 새 창에서 카카오 로그인 페이지 열기 (팝업으로 변경)
      const popup = window.open(kakaoURL, 'kakao-login', 'width=600,height=800');
      
      if (!popup) {
        console.error('팝업이 차단되었습니다');
        alert('팝업 차단을 해제해주세요.');
        return;
      }
      
      // 팝업 창에서 메시지 수신 설정
      const messageHandler = (event: MessageEvent) => {
        // 카카오 로그인 완료 후 리다이렉트될 도메인에서 오는 메시지만 처리
        if (event.origin === window.location.origin) {
          console.log('메시지 수신됨');
          
          if (event.data && event.data.token) {
            // 로그인 처리
            localStorage.setItem('token', event.data.token);
            localStorage.setItem('userInfo', JSON.stringify({
              nickname: event.data.nickname,
              profileImage: event.data.profileImage
            }));
            setUserInfo({
              nickname: event.data.nickname,
              profileImage: event.data.profileImage
            });
            console.log('메시지를 통해 로그인 성공');
            
            // 팝업 창 닫기
            if (popup && !popup.closed) {
              popup.close();
            }
            
            // 이벤트 리스너 제거
            window.removeEventListener('message', messageHandler);
          }
        }
      };
      
      // 메시지 이벤트 리스너 추가
      window.addEventListener('message', messageHandler);
      
      // 팝업 창이 닫히는지 주기적으로 확인
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          
          // 현재 URL에 code 파라미터가 있는지 확인
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          if (code) {
            console.log('URL에서 코드 발견, 처리 시작');
            handleKakaoCallback(code);
          } else {
            console.log('팝업이 닫혔으나 코드가 없음 (로그인 취소 또는 실패)');
          }
        }
      }, 500);
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
              <Link 
                href='/taxi' 
                className={styles.menuItem}
                onClick={() => {
                  if (pathname.startsWith('/chat/')) {
                    const chatId = pathname.split('/').pop();
                    if (chatId) {
                      setMinimizedChatId(chatId);
                      setIsMinimized(true);
                    }
                  }
                }}
              >
                택시 모집
              </Link>
            </li>
            <li className={styles.menuListItem}>
              {userInfo ? (
                <div className={styles.dropdown} ref={dropdownRef}>
                  <button onClick={toggleDropdown} className={styles.menuItem}>
                    {userInfo.nickname}님
                  </button>
                  <div className={`${styles.dropdownContent} ${isDropdownOpen ? styles.show : ''}`}>
                    <Link 
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