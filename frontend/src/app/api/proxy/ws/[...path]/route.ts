import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying WS request to: ${url}`);
    
    const headers = new Headers();
    // Copy only necessary headers
    if (request.headers.has('authorization')) {
      headers.set('Authorization', request.headers.get('authorization')!);
    }
    headers.set('Accept', '*/*');
    
    // Handle WebSocket upgrade if needed
    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      headers.set('Connection', 'Upgrade');
      headers.set('Upgrade', 'websocket');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    // Handle WebSocket upgrade response
    if (response.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      return new NextResponse(response.body, {
        status: 101,
        headers: {
          'Connection': 'Upgrade',
          'Upgrade': 'websocket',
        },
      });
    }
    
    const data = await response.text();
    try {
      const jsonData = JSON.parse(data);
      return new NextResponse(JSON.stringify(jsonData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('WS Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: '웹소켓 연결 중 오류가 발생했습니다.' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 