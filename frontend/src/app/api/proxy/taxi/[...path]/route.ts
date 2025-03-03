import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/${path}${request.nextUrl.search || ''}`;
    
    console.log(`Proxying Taxi GET request to: ${url}`);
    
    // 헤더 복사하고 필요한 것만 수정
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // host 헤더 제외하고 복사
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const data = await response.text();
    
    try {
      // JSON으로 파싱 시도
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData, { 
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (e) {
      // JSON이 아니면 텍스트로 반환
      return new NextResponse(data, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    console.error('Taxi Proxy error:', error);
    return NextResponse.json(
      { error: '택시 API 요청 중 오류가 발생했습니다.' },
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
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/${path}`;
    
    console.log(`Proxying Taxi POST request to: ${url}`);
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.warn('Request body is not JSON, using text/raw body instead');
      body = await request.text();
    }
    
    // 헤더 복사하고 필요한 것만 수정
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // host 헤더 제외하고 복사
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // Content-Type 설정
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      redirect: 'follow',
    });
    
    const data = await response.text();
    
    try {
      // JSON으로 파싱 시도
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData, { 
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (e) {
      // JSON이 아니면 텍스트로 반환
      return new NextResponse(data, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    console.error('Taxi Proxy error:', error);
    return NextResponse.json(
      { error: '택시 API 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS 프리플라이트 요청)
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 