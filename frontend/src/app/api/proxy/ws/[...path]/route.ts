import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/ws/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying WS request to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    // CORS 헤더 추가
    if (request.headers.get('origin')) {
      headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
      headers.set('Access-Control-Allow-Credentials', 'true');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
    }
    
    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: headers
      });
    }
    
    const response = await fetch(url, {
      method: request.method,
      headers,
      cache: 'no-store',
    });
    
    // 응답 본문과 헤더 전달
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
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
  // POST 요청도 GET과 동일하게 처리
  return GET(request, { params });
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // OPTIONS 요청 처리
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  
  return new NextResponse(null, {
    status: 200,
    headers: headers
  });
} 