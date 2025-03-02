import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const direction = searchParams.get('direction') || 'fromMJUtoGH';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    
    const response = await fetch(`${backendUrl}/bus/${direction}`, {
      next: { revalidate: 30 }, // 30초마다 재검증
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch bus data:', error);
    return NextResponse.json(
      { error: '버스 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 