import { NextRequest, NextResponse } from 'next/server';

// 모든 HTTP 메서드 처리를 위한 공통 핸들러
async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 경로 파라미터 가져오기 및 재구성
    const path = params.path.join('/');
    
    // 명시적으로 http 프로토콜 추가
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/iframe/${path}${request.nextUrl.search}`;
    
    console.log(`WebSocket iframe dynamic proxy: ${request.method} to: ${url}`);
    
    // 요청 헤더 복사
    const headers = new Headers(request.headers);
    
    // 요청 옵션 생성
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
    };
    
    // GET이 아닌 메서드의 경우 본문 추가
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestOptions.body = await request.text();
    }
    
    // 요청 전송
    const response = await fetch(url, requestOptions);
    
    // 응답 상태 및 헤더 로깅
    console.log(`WebSocket iframe dynamic proxy response status: ${response.status}`);
    
    // 응답 그대로 반환
    const data = await response.text();
    
    // 응답 헤더 복사
    const responseHeaders = new Headers(response.headers);
    
    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('WebSocket iframe dynamic proxy error:', error);
    return NextResponse.json(
      { error: '웹소켓 iframe 요청 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
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