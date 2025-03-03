import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying WS request to: ${url}`);
    
    const headers = new Headers(request.headers);
    headers.set('Origin', backendUrl);
    
    // SockJS handshake requires these headers
    if (request.headers.get('upgrade') === 'websocket') {
      headers.set('Connection', 'Upgrade');
      headers.set('Upgrade', 'websocket');
    }
    
    const response = await fetch(url, {
      method: request.method,
      headers,
      cache: 'no-store',
    });
    
    // Handle WebSocket upgrade response
    if (response.headers.get('upgrade') === 'websocket') {
      return new NextResponse(response.body, {
        status: 101,
        headers: response.headers,
      });
    }
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('WS Proxy error:', error);
    return NextResponse.json(
      { error: '웹소켓 연결 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 