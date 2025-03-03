import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/bus/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying Bus GET request to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      next: { revalidate: 30 }, // 30초마다 재검증
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Bus Proxy error:', error);
    return NextResponse.json(
      { error: '버스 정보 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 