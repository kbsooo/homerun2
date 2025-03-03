import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '//3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/leave`;
    
    console.log(`Proxying POST request to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });
    
    const data = await response.text();
    
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
      { error: '서버 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 