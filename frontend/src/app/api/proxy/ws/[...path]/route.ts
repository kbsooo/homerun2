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
    
    const headers = new Headers(request.headers);
    headers.delete('host');
    
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

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying WS POST request to: ${url}`);
    
    const headers = new Headers(request.headers);
    headers.delete('host');
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: request.body,
    });
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('WS Proxy POST error:', error);
    return NextResponse.json(
      { error: '웹소켓 POST 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 