import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/chat/${id}`;
    
    console.log(`Chat messages API: Forwarding to: ${url}`);
    console.log(`Chat messages API request headers:`, Object.fromEntries([...request.headers.entries()]));
    
    // 헤더 복사 및 필요에 따라 추가
    const headers = new Headers(request.headers);
    headers.set('Origin', backendUrl);
    
    // 요청 옵션 생성 - 자격 증명 포함
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      credentials: 'include',
      mode: 'cors',
      keepalive: true,
    });
    
    // 응답 상태 및 헤더 로깅
    console.log(`Chat messages API response status: ${response.status}`);
    console.log(`Chat messages API response headers: ${JSON.stringify(Object.fromEntries([...response.headers.entries()]))}`);
    
    const data = await response.text();
    console.log(`Chat messages API response data (first 100 chars): ${data.substring(0, 100)}...`);
    
    // 응답 헤더 복사 및 CORS 헤더 추가
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData, { 
        status: response.status,
        headers: responseHeaders
      });
    } catch (e) {
      // If not JSON, return as text
      return new NextResponse(data, {
        status: response.status,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    console.error('Chat messages API error:', error);
    return NextResponse.json(
      { error: '채팅 메시지를 가져오는 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 