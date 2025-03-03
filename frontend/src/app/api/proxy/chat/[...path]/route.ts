import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/chat/${path}${request.nextUrl.search || ''}`;
    
    console.log(`Proxying Chat GET request to: ${url}`);
    
    // 헤더 복사하고 필요한 것만 수정
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // host 헤더 제외하고 복사
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // 인증 헤더 로깅 및 쿠키 검사 (디버깅용)
    if (headers.has('authorization')) {
      const authHeader = headers.get('authorization') || '';
      console.log('Authorization header is present:', authHeader.substring(0, 15) + '...');
    } else {
      console.log('No Authorization header in request - this will likely fail');
    }

    // 쿠키 확인
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      console.log('Cookie header is present');
      headers.set('cookie', cookieHeader);
    } else {
      console.log('No cookie in request');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      redirect: 'follow',
      credentials: 'include',
    });
    
    // 응답 상태 로깅
    console.log(`Chat proxy response status: ${response.status}`);
    if (response.status === 403 || response.status === 401) {
      const responseBody = await response.text();
      console.error('Auth error response:', responseBody);
      return NextResponse.json(
        { error: '채팅 서버 접근 권한이 없습니다. 로그인 상태를 확인해주세요.' },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    const data = await response.text();
    console.log(`Chat proxy response data length: ${data.length}`);
    
    try {
      // JSON으로 파싱 시도
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON response data:', JSON.stringify(jsonData).substring(0, 100) + '...');
      return NextResponse.json(jsonData, { 
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (e) {
      // JSON이 아니면 텍스트로 반환
      console.log('Response is not JSON, returning as text');
      return new NextResponse(data, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    console.error('Chat Proxy error:', error);
    return NextResponse.json(
      { error: '채팅 API 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/chat/${path}${request.nextUrl.search || ''}`;
    
    console.log(`Proxying Chat POST request to: ${url}`);
    
    let body;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body).substring(0, 100) + (JSON.stringify(body).length > 100 ? '...' : ''));
    } catch (error) {
      console.warn('Request body is not JSON, using text/raw body instead');
      body = await request.text();
    }
    
    // 헤더 복사하고 필요한 것만 수정
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // host 헤더 제외하고 복사
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // 인증 헤더 로깅 (디버깅용)
    if (headers.has('authorization')) {
      const authHeader = headers.get('authorization') || '';
      console.log('Authorization header is present in POST request:', authHeader.substring(0, 15) + '...');
    } else {
      console.log('No Authorization header in POST request - this will likely fail');
    }
    
    // 쿠키 확인
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      console.log('Cookie header is present in POST request');
      headers.set('cookie', cookieHeader);
    } else {
      console.log('No cookie in POST request');
    }
    
    // Content-Type 설정
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      redirect: 'follow',
      credentials: 'include',
    });
    
    // 응답 상태 로깅
    console.log(`Chat proxy POST response status: ${response.status}`);
    if (response.status === 403 || response.status === 401) {
      const responseBody = await response.text();
      console.error('Auth error response for POST:', responseBody);
      return NextResponse.json(
        { error: '채팅 서버 접근 권한이 없습니다. 로그인 상태를 확인해주세요.' },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    const data = await response.text();
    console.log(`Chat proxy POST response data length: ${data.length}`);
    
    try {
      // JSON으로 파싱 시도
      const jsonData = JSON.parse(data);
      console.log('Parsed POST response data:', JSON.stringify(jsonData).substring(0, 100) + '...');
      return NextResponse.json(jsonData, { 
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (e) {
      // JSON이 아니면 텍스트로 반환
      console.log('POST response is not JSON, returning as text');
      return new NextResponse(data, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    console.error('Chat Proxy POST error:', error);
    return NextResponse.json(
      { error: '채팅 API 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS 프리플라이트 요청)
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 