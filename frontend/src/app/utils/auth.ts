import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 클라이언트에서 JWT 토큰의 유효성을 간단히 확인합니다.
 * 토큰이 유효하지 않은 경우 로그아웃 처리하고 홈으로 리디렉션합니다.
 */
export function validateTokenAndRedirect(
  router: AppRouterInstance, 
  showToast?: (message: string, type: 'info' | 'success' | 'warning' | 'error', duration?: number) => void
): boolean {
  const token = localStorage.getItem('token');
  const userInfo = localStorage.getItem('userInfo');
  
  if (!token || !userInfo) {
    router.push('/');
    return false;
  }

  try {
    // JWT 형식 검증
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid token format');
      handleLogout(router, showToast);
      return false;
    }

    // 만료 시간 확인
    const payload = JSON.parse(atob(tokenParts[1]));
    const exp = payload.exp * 1000; // JWT exp는 초 단위, JS Date는 밀리초 단위
    
    if (Date.now() >= exp) {
      console.error('Token has expired on client-side check');
      handleLogout(router, showToast);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    handleLogout(router, showToast);
    return false;
  }
}

/**
 * 로그아웃 처리 함수
 */
export function handleLogout(
  router: AppRouterInstance, 
  showToast?: (message: string, type: 'info' | 'success' | 'warning' | 'error', duration?: number) => void
): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  
  if (showToast) {
    showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } else {
    router.push('/');
  }
}

/**
 * 서버 응답에서 토큰 만료 오류를 처리합니다.
 */
export function handleAuthError(
  response: Response, 
  router: AppRouterInstance,
  showToast?: (message: string, type: 'info' | 'success' | 'warning' | 'error', duration?: number) => void
): Promise<boolean> {
  return new Promise(async (resolve) => {
    if (response.status === 403) {
      try {
        const text = await response.text();
        console.log('Auth error response:', text);
        
        try {
          const data = JSON.parse(text);
          if (data.error && (
              data.error.includes('로그인이 만료되었습니다') || 
              data.error.includes('유효하지 않은 인증입니다') || 
              data.error.includes('로그인이 필요합니다'))) {
            console.log('Token invalid or expired, redirecting to home');
            handleLogout(router, showToast);
            resolve(true); // 인증 오류 처리됨
            return;
          }
        } catch (e) {
          console.error('Failed to parse JSON from 403 response:', e);
        }
      } catch (e) {
        console.error('Error reading response text:', e);
      }
    }
    
    resolve(false); // 인증 오류가 아님
  });
} 