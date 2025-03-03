import { NextRequest, NextResponse } from 'next/server';

// 모든 HTTP 메소드에 대한 핸들러 함수
export async function handleRequest(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  console.log(`WebSocket Proxy ${req.method} request`);

  try {
    // 원래 요청의 URL 파라미터와 패스를 추출
    const path = params.path.join('/');
    const searchParams = req.nextUrl.search || '';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${searchParams}`;

    console.log(`Proxying WebSocket request to: ${url}`);

    // 요청 헤더 복사 
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // 클라이언트측 host 헤더는 제외
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // 인증 헤더 확인 및 전달
    if (req.headers.has('authorization')) {
      const authHeader = req.headers.get('authorization') || '';
      console.log('Authorization header present:', authHeader.substring(0, 15) + '...');
      // 확실히 인증 헤더 설정
      headers.set('Authorization', authHeader);
    } else {
      console.log('No Authorization header - this may cause authentication issues');
    }
    
    // 쿠키 확인 및 전달
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      console.log('Cookie header is present in WebSocket request');
      headers.set('cookie', cookieHeader);
    } else {
      console.log('No cookie in WebSocket request');
    }

    // 요청 메소드에 따라 body 처리
    let options: RequestInit = {
      method: req.method,
      headers,
      redirect: 'follow',
      credentials: 'include', // 쿠키 전달 활성화
    };

    // GET 이외의 메소드에서는 body 포함
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const jsonBody = await req.json();
          console.log('Request JSON body:', JSON.stringify(jsonBody).substring(0, 100) + '...');
          options.body = JSON.stringify(jsonBody);
        } else {
          const body = await req.text();
          console.log('Request text body length:', body.length);
          options.body = body;
        }
      } catch (error) {
        console.error('Error reading request body:', error);
      }
    }

    // 백엔드로 요청 전달
    console.log('Sending request to backend with options:', {
      method: options.method,
      headersKeys: [...headers.keys()], 
      credentialsMode: options.credentials
    });
    
    const response = await fetch(url, options);
    console.log('WebSocket proxy response status:', response.status);
    
    // 401/403 오류 처리
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication error in WebSocket proxy:', response.status);
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      
      return NextResponse.json(
        { error: '웹소켓 인증 오류가 발생했습니다. 다시 로그인 후 시도해주세요.' },
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
    
    const responseData = await response.text();
    console.log('WebSocket response data length:', responseData.length);

    // 응답 헤더 설정
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // CORS 헤더 추가
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 응답 반환
    try {
      // JSON으로 파싱 시도
      const jsonData = JSON.parse(responseData);
      console.log('Parsed WebSocket response JSON:', JSON.stringify(jsonData).substring(0, 100) + '...');
      return NextResponse.json(jsonData, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch {
      // 텍스트 응답 반환
      return new NextResponse(responseData, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    console.error('WebSocket Proxy error:', error);
    return NextResponse.json(
      { error: '웹소켓 프록시 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 모든 HTTP 메소드 핸들러 정의
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const HEAD = handleRequest;
export const OPTIONS = async (req: NextRequest, ctx: { params: { path: string[] } }) => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}; 