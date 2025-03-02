import { NextRequest, NextResponse } from 'next/server';

// 모든 HTTP 메서드 처리를 위한 공통 핸들러
async function handler(request: NextRequest) {
  try {
    // 명시적으로 http 프로토콜 추가
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/info${request.nextUrl.search}`;
    
    console.log(`WebSocket info proxy: ${request.method} to: ${url}`);
    
    // 요청 헤더 복사 - X-Forwarded-For 추가
    const headers = new Headers(request.headers);
    
    // 요청 옵션 생성 - 자격 증명 포함
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include',
      mode: 'cors',
    };
    
    // GET이 아닌 메서드의 경우 본문 추가
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestOptions.body = await request.text();
    }
    
    // 요청 전송
    const response = await fetch(url, requestOptions);
    
    // 응답 상태 및 헤더 로깅
    console.log(`WebSocket info proxy response status: ${response.status}`);
    console.log(`WebSocket info proxy response headers: ${JSON.stringify([...response.headers.entries()])}`);
    
    // 응답 그대로 반환
    const data = await response.text();
    
    // 응답 헤더 복사 - 모든 CORS 헤더 추가
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    
    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('WebSocket info proxy error:', error);
    return NextResponse.json(
      { error: '웹소켓 info 요청 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 모든 HTTP 메서드에 대한 핸들러 함수 정의
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
export const OPTIONS = handler; 