import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const direction = searchParams.get('direction') || 'fromMJUtoGH';
    
    const response = await fetch(`/api/proxy/bus/${direction}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`버스 데이터 가져오기 실패: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('버스 데이터 가져오기 실패:', error);
    return NextResponse.json(
      { error: '버스 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 