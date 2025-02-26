import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    // 백엔드 서버로 코드 전달
    const backendUrl = process.env.BACKEND_URL || 'http://3.27.108.105:8080';
    
    console.log('카카오 인증 코드를 백엔드로 전송:', code);
    
    const response = await fetch(`${backendUrl}/api/auth/kakao/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('백엔드 응답 오류:', response.status, errorText);
      throw new Error(`Backend login failed: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('백엔드 로그인 성공 응답:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API 라우트 오류:', error);
    return NextResponse.json(
      { error: 'Authentication failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 