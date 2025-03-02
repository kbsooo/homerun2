import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '//3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying WS request to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    // 이 부분에서 실제 웹소켓 프록시는 복잡합니다. 
    // 여기서는 일반 HTTP 프록시만 처리하고 클라이언트에서 SockJS를 직접 연결하게 합니다.
    const response = await fetch(url, {
      method: request.method,
      headers,
      cache: 'no-store',
    });
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('WS Proxy error:', error);
    return NextResponse.json(
      { error: '웹소켓 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 