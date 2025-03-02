import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/group/${id}`;
    
    console.log(`Chat group API: Forwarding to: ${url}`);
    
    const headers = new Headers(request.headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    // 응답 상태 로깅
    console.log(`Chat group API response status: ${response.status}`);
    
    const data = await response.text();
    console.log(`Chat group API response data: ${data}`);
    
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
    console.error('Chat group API error:', error);
    return NextResponse.json(
      { error: '채팅 그룹 정보를 가져오는 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 