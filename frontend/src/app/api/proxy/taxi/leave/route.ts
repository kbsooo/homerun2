import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 명시적으로 http 프로토콜 추가
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/leave`;
    
    console.log(`Proxy leave API: Forwarding to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });
    
    // 응답 상태 로깅
    console.log(`Proxy response status: ${response.status}`);
    
    const data = await response.text();
    console.log(`Proxy response data: ${data}`);
    
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData, { status: response.status });
    } catch (e) {
      // If not JSON, return as text
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: '서버 요청 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 