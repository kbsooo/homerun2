import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 명시적으로 http 프로토콜 추가
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws${request.nextUrl.search}`;
    
    console.log(`WebSocket base proxy: Forwarding to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    // 응답 그대로 반환
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error('WebSocket base proxy error:', error);
    return NextResponse.json(
      { error: '웹소켓 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 명시적으로 http 프로토콜 추가
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws${request.nextUrl.search}`;
    
    console.log(`WebSocket base proxy POST: Forwarding to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    // 요청 본문 가져오기
    const body = await request.text();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body
    });
    
    // 응답 그대로 반환
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error('WebSocket base proxy POST error:', error);
    return NextResponse.json(
      { error: '웹소켓 POST 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 