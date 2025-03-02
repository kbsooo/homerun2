import { NextResponse } from 'next/server';

export interface ChatHistory {
  id: string;
  date: string;
  roomId: string;
  lastMessage: string;
  participants: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
}

export async function GET(request: Request) {
  const token = request.headers.get('Authorization');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Fetching chat histories with token:', token);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://3.27.108.105:8080';
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://homerun2.vercel.app';
    
    const response = await fetch(`${backendUrl}/api/chat/histories`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': frontendUrl
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    console.log('Response status:', response.status);
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('Response headers:', responseHeaders);

    // 응답이 없는 경우 체크
    if (!response) {
      console.error('No response received');
      return NextResponse.json(
        { error: '서버 응답이 없습니다.' },
        { status: 500 }
      );
    }

    const text = await response.text();
    console.log('Raw response text:', text);

    // 응답 내용이 비어있는 경우 체크
    if (!text.trim()) {
      console.error('Empty response received');
      return NextResponse.json(
        { error: '서버에서 빈 응답을 받았습니다.' },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed data:', data);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      return NextResponse.json(
        { error: '서버 응답을 JSON으로 파싱하는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Server returned error:', data);
      const errorMessage = data?.message || '채팅 기록을 불러오는데 실패했습니다.';
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    if (!Array.isArray(data)) {
      console.error('Invalid response format, expected array:', data);
      return NextResponse.json(
        { error: '서버에서 잘못된 데이터 형식을 받았습니다.' },
        { status: 500 }
      );
    }

    // 성공 응답
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching chat histories:', error);
    return NextResponse.json(
      { error: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
} 