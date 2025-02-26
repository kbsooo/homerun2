import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

// 카카오 로그인 후 리다이렉트되는 GET 요청 처리
export async function GET(request: Request) {
  try {
    // URL에서 인증 코드 추출
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      console.error('카카오 인증 코드가 없습니다.');
      // 인증 코드가 없으면 홈으로 리다이렉트
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/?error=no_code'
        }
      });
    }
    
    console.log('카카오 인증 코드 수신(GET):', code.substring(0, 10) + '...');
    
    // 백엔드 서버 URL 결정
    // HTTPS 환경에서는 HTTPS 백엔드 URL 사용, 아니면 기본 HTTP URL 사용
    const isProduction = process.env.NODE_ENV === 'production';
    
    // VERCEL 환경변수에서 백엔드 URL 가져오기 시도
    // 프로덕션에서는 HTTPS 백엔드를 사용해야 Mixed Content 오류 방지
    let backendUrl = process.env.BACKEND_URL;
    
    // 백엔드 URL이 정의되지 않은 경우 기본값 사용
    if (!backendUrl) {
      backendUrl = isProduction 
        ? 'https://api.homerun2.site' // 프로덕션 환경인 경우 HTTPS URL (예시)
        : 'http://3.27.108.105:8080';  // 개발 환경인 경우 기존 URL
    }
    
    console.log('사용 중인 백엔드 URL:', backendUrl);
    console.log('카카오 로그인 API 호출 시도 중...');
    
    // 백엔드 API 호출 (타임아웃 10초 설정)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/kakao/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('백엔드 응답 상태:', response.status);
      
      // 응답 성공 여부 확인
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`백엔드 오류 (${response.status}):`, errorText);
        
        // 개발 중이거나 테스트 목적인 경우에만 임시 성공 응답 제공
        if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_LOGIN === 'true') {
          console.log('테스트용 임시 로그인 응답 제공');
          const testData = {
            token: 'test_token_for_debugging',
            nickname: '테스트 사용자',
            profileImage: 'https://via.placeholder.com/150'
          };
          return new Response(null, {
            status: 302,
            headers: {
              'Location': `/?loginData=${encodeURIComponent(JSON.stringify(testData))}`
            }
          });
        }
        
        // 프로덕션에서는 실제 오류 반환 - 오류 메시지와 함께 홈으로 리다이렉트
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `/?error=backend_error&status=${response.status}`
          }
        });
      }
      
      // 성공적인 응답 처리
      const data = await response.json();
      console.log('로그인 성공:', { hasToken: Boolean(data.token), hasUserInfo: Boolean(data.nickname) });
      
      // 로그인 데이터를 URL 파라미터로 전달하면서 홈으로 리다이렉트
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/?loginData=${encodeURIComponent(JSON.stringify(data))}`
        }
      });
      
    } catch (fetchError) {
      console.error('백엔드 연결 오류:', fetchError);
      
      // 개발 중이거나 테스트 목적인 경우에만 임시 성공 응답 제공
      if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_LOGIN === 'true') {
        console.log('테스트용 임시 로그인 응답 제공');
        const testData = {
          token: 'test_token_for_debugging',
          nickname: '테스트 사용자',
          profileImage: 'https://via.placeholder.com/150'
        };
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `/?loginData=${encodeURIComponent(JSON.stringify(testData))}`
          }
        });
      }
      
      // 오류와 함께 홈으로 리다이렉트
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/?error=connection_error&message=${encodeURIComponent(fetchError instanceof Error ? fetchError.message : 'Unknown error')}`
        }
      });
    }
    
  } catch (error) {
    console.error('API 라우트 전체 오류:', error);
    
    // 개발 중이거나 테스트 목적인 경우에만 임시 성공 응답 제공
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_LOGIN === 'true') {
      const testData = {
        token: 'test_token_for_debugging',
        nickname: '테스트 사용자',
        profileImage: 'https://via.placeholder.com/150'
      };
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/?loginData=${encodeURIComponent(JSON.stringify(testData))}`
        }
      });
    }
    
    // 오류와 함께 홈으로 리다이렉트
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/?error=internal_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
      }
    });
  }
}

// Kakao 인증 코드를 백엔드로 전달하는 API 라우트
export async function POST(request: Request) {
  try {
    // 요청 데이터 추출
    const { code } = await request.json();
    
    if (!code) {
      console.error('카카오 인증 코드가 없습니다.');
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }
    
    console.log('카카오 인증 코드 수신:', code.substring(0, 10) + '...');
    
    // 백엔드 서버 URL 결정
    // HTTPS 환경에서는 HTTPS 백엔드 URL 사용, 아니면 기본 HTTP URL 사용
    const isProduction = process.env.NODE_ENV === 'production';
    
    // VERCEL 환경변수에서 백엔드 URL 가져오기 시도
    // 프로덕션에서는 HTTPS 백엔드를 사용해야 Mixed Content 오류 방지
    let backendUrl = process.env.BACKEND_URL;
    
    // 백엔드 URL이 정의되지 않은 경우 기본값 사용
    if (!backendUrl) {
      backendUrl = isProduction 
        ? 'https://api.homerun2.site' // 프로덕션 환경인 경우 HTTPS URL (예시)
        : 'http://3.27.108.105:8080';  // 개발 환경인 경우 기존 URL
    }
    
    console.log('사용 중인 백엔드 URL:', backendUrl);
    console.log('카카오 로그인 API 호출 시도 중...');
    
    // 백엔드 API 호출 (타임아웃 10초 설정)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/kakao/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('백엔드 응답 상태:', response.status);
      
      // 응답 성공 여부 확인
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`백엔드 오류 (${response.status}):`, errorText);
        
        // 개발 중이거나 테스트 목적인 경우에만 임시 성공 응답 제공
        if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_LOGIN === 'true') {
          console.log('테스트용 임시 로그인 응답 제공');
          return NextResponse.json({
            token: 'test_token_for_debugging',
            nickname: '테스트 사용자',
            profileImage: 'https://via.placeholder.com/150'
          });
        }
        
        // 프로덕션에서는 실제 오류 반환
        return NextResponse.json(
          { error: `Backend error: ${response.status}` }, 
          { status: response.status }
        );
      }
      
      // 성공적인 응답 처리
      const data = await response.json();
      console.log('로그인 성공:', { hasToken: Boolean(data.token), hasUserInfo: Boolean(data.nickname) });
      return NextResponse.json(data);
      
    } catch (fetchError) {
      console.error('백엔드 연결 오류:', fetchError);
      
      // 개발 중이거나 테스트 목적인 경우에만 임시 성공 응답 제공
      if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_LOGIN === 'true') {
        console.log('테스트용 임시 로그인 응답 제공');
        return NextResponse.json({
          token: 'test_token_for_debugging',
          nickname: '테스트 사용자',
          profileImage: 'https://via.placeholder.com/150'
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to connect to backend server', message: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('API 라우트 전체 오류:', error);
    
    // 개발 중이거나 테스트 목적인 경우에만 임시 성공 응답 제공
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_LOGIN === 'true') {
      return NextResponse.json({
        token: 'test_token_for_debugging',
        nickname: '테스트 사용자',
        profileImage: 'https://via.placeholder.com/150'
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 