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
    
    const headers = new Headers();
    if (request.headers.has('authorization')) {
      headers.set('Authorization', request.headers.get('authorization')!);
    }
    headers.set('Accept', '*/*');
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    // 응답을 먼저 텍스트로 읽습니다
    const textData = await response.text();
    
    // JSON으로 파싱을 시도합니다
    try {
      const jsonData = JSON.parse(textData);
      return new NextResponse(JSON.stringify(jsonData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      // JSON 파싱에 실패하면 텍스트로 반환합니다
      return new NextResponse(textData, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('Bus Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: '버스 서버 요청 중 오류가 발생했습니다.' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 