import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying WS GET request to: ${url}`);
    
    const headers = new Headers();
    // Copy only necessary headers
    if (request.headers.has('authorization')) {
      headers.set('Authorization', request.headers.get('authorization')!);
    }
    
    // 웹소켓 관련 헤더 및 기본 헤더 설정
    headers.set('Accept', '*/*');
    headers.set('Origin', new URL(request.url).origin);
    
    // Handle WebSocket upgrade if needed
    if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      headers.set('Connection', 'Upgrade');
      headers.set('Upgrade', 'websocket');
      
      if (request.headers.has('sec-websocket-key')) {
        headers.set('Sec-WebSocket-Key', request.headers.get('sec-websocket-key')!);
      }
      
      if (request.headers.has('sec-websocket-version')) {
        headers.set('Sec-WebSocket-Version', request.headers.get('sec-websocket-version')!);
      }
      
      if (request.headers.has('sec-websocket-extensions')) {
        headers.set('Sec-WebSocket-Extensions', request.headers.get('sec-websocket-extensions')!);
      }
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    // Handle WebSocket upgrade response
    if (response.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      const newHeaders = new Headers();
      newHeaders.set('Connection', 'Upgrade');
      newHeaders.set('Upgrade', 'websocket');
      
      if (response.headers.has('sec-websocket-accept')) {
        newHeaders.set('Sec-WebSocket-Accept', response.headers.get('sec-websocket-accept')!);
      }
      
      return new NextResponse(response.body, {
        status: 101,
        headers: newHeaders,
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

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying WS POST request to: ${url}`);
    
    const headers = new Headers();
    // Copy only necessary headers
    if (request.headers.has('authorization')) {
      headers.set('Authorization', request.headers.get('authorization')!);
    }
    
    headers.set('Accept', '*/*');
    headers.set('Origin', new URL(request.url).origin);
    
    let body;
    try {
      body = await request.text();
    } catch (e) {
      console.log('No body or not text');
      body = '';
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
    
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain',
      },
    });
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions',
      'Access-Control-Max-Age': '86400',
    },
  });
} 