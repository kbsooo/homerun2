import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/shuttle/${path}${request.nextUrl.search}`;
    
    console.log(`셔틀 GET 요청을 프록시합니다: ${url}`);
    
    // 새 Headers 객체를 생성하여 필요한 헤더만 복사
    const headers = new Headers();
    if (request.headers.has('Authorization')) {
      headers.set('Authorization', request.headers.get('Authorization')!);
    }
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    const data = await response.text();
    
    try {
      // JSON으로 파싱 시도
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData, { status: response.status });
    } catch (e) {
      // JSON이 아닌 경우 텍스트로 반환
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    console.error('셔틀 프록시 오류:', error);
    return NextResponse.json(
      { error: '셔틀 정보 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 