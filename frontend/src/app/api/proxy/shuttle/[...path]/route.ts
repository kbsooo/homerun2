import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '//3.27.108.105:8080';
    const url = `${backendUrl}/api/shuttle/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying Shuttle GET request to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      next: { revalidate: 30 }, // 30초마다 재검증
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
    console.error('Shuttle Proxy error:', error);
    return NextResponse.json(
      { error: '셔틀 정보 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 