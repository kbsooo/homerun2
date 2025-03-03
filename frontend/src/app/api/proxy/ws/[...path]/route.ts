import { NextRequest, NextResponse } from 'next/server';

// 모든 HTTP 메서드에 대한 핸들러 (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS 등)
export async function handleRequest(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 인증 헤더 확인 및 로깅
    const authHeader = req.headers.get('authorization');
    console.log(`WebSocket proxy: Authorization header present: ${!!authHeader}`);
    
    // 요청 경로 및 메서드 로깅
    console.log(`WebSocket proxy: ${req.method} request for ${params.path.join('/')}`);
    
    // 백엔드 URL 설정
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    
    // 전체 URL 구성
    const url = `${backendUrl}/ws/${params.path.join('/')}${req.nextUrl.search || ''}`;
    console.log(`WebSocket proxy to: ${url}`);
    
    // 헤더 복사 (host 헤더 제외)
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.append(key, value);
      }
    });
    
    // 요청 본문 읽기 (있는 경우)
    let body: BodyInit | null = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
      console.log(`WebSocket proxy: Request body length: ${(body as string).length} bytes`);
    }
    
    // 백엔드로 요청 전달
    const backendResponse = await fetch(url, {
      method: req.method,
      headers,
      body,
      credentials: 'include',
    });
    
    console.log(`WebSocket proxy: Backend response status: ${backendResponse.status} ${backendResponse.statusText}`);
    
    // 오류 상태 처리
    if (backendResponse.status >= 400) {
      let errorText = await backendResponse.text();
      console.error(`WebSocket proxy error response (${backendResponse.status}): ${errorText}`);
      
      // 인증 오류 특별 처리
      if (backendResponse.status === 401 || backendResponse.status === 403) {
        return new NextResponse(errorText, {
          status: backendResponse.status,
          statusText: 'Authentication Error',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
    }
    
    // 응답 처리
    let responseData;
    const contentType = backendResponse.headers.get('content-type');
    
    // 헤더 복사
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      responseHeaders.append(key, value);
    });
    
    try {
      responseData = await backendResponse.text();
      return new NextResponse(responseData, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      console.error('WebSocket proxy: Error processing response', error);
      return new NextResponse(null, {
        status: 502,
        statusText: 'Bad Gateway',
      });
    }
  } catch (error) {
    console.error('WebSocket proxy error:', error);
    return NextResponse.json(
      { error: 'WebSocket Proxy Error' },
      { status: 500 }
    );
  }
}

// 모든 HTTP 메서드에 대한 핸들러를 export
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const HEAD = handleRequest;
export const OPTIONS = handleRequest; 