import { NextRequest, NextResponse } from 'next/server';

// 모든 HTTP 메서드 처리를 위한 공통 핸들러
async function handler(request: NextRequest) {
  try {
    // 명시적으로 http 프로토콜 추가
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/xhr_send${request.nextUrl.search}`;
    
    console.log(`WebSocket xhr_send proxy: ${request.method} to: ${url}`);
    console.log(`WebSocket xhr_send request headers:`, Object.fromEntries([...request.headers.entries()]));
    
    // 요청 헤더 복사 및 필요에 따라 추가
    const headers = new Headers(request.headers);
    headers.set('Origin', backendUrl);
    
    // 요청 옵션 생성 - 자격 증명 포함
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include',
      mode: 'cors',
      keepalive: true,
    };
    
    // GET이 아닌 메서드의 경우 본문 추가
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      console.log(`WebSocket xhr_send request body: ${body}`);
      requestOptions.body = body;
    }
    
    // 요청 전송
    const response = await fetch(url, requestOptions);
    
    // 응답 상태 및 헤더 로깅
    console.log(`WebSocket xhr_send proxy response status: ${response.status}`);
    console.log(`WebSocket xhr_send proxy response headers: ${JSON.stringify(Object.fromEntries([...response.headers.entries()]))}`);
    
    // 응답 그대로 반환
    const data = await response.text();
    console.log(`WebSocket xhr_send proxy response data (first 100 chars): ${data.substring(0, 100)}...`);
    
    // 응답 헤더 복사 및 CORS 헤더 추가
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    responseHeaders.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    responseHeaders.delete('X-Frame-Options'); // iframe 문제 해결
    
    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('WebSocket xhr_send proxy error:', error);
    return NextResponse.json(
      { error: '웹소켓 xhr_send 요청 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
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