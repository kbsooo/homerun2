import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { chatRoomId: string } }
) {
  const token = request.headers.get('Authorization');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`Fetching chat messages for room: ${params.chatRoomId}`);
    
    // 백엔드 URL을 직접 참조하는 대신 Next.js rewrites가 처리하도록 상대 경로 사용
    const response = await fetch(`http://3.27.108.105:8080/api/chat/messages/${params.chatRoomId}`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server response:', errorData);
      throw new Error(`Failed to fetch chat messages: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 