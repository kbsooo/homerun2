import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    console.log(`Proxying GET request for ${params.path.join('/')}`);
    
    // 기본 백엔드 URL
    const backendUrl = process.env.BACKEND_URL || 'http://3.27.108.105:8080';
    
    // 인증 헤더 검증 및 로깅
    const authHeader = request.headers.get('authorization');
    console.log(`Authorization header present: ${!!authHeader}`);
    
    // path 조합 및 검증
    if (!params.path || params.path.length === 0) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // URL 구성
    const apiPath = params.path.join('/');
    const url = `${backendUrl}/api/chat/${apiPath}${request.nextUrl.search || ''}`;
    console.log(`Proxying to: ${url}`);

    // 헤더 복사 (host 헤더 제외)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.append(key, value);
      }
    });

    // 요청 전송
    const backendResponse = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    console.log(`Backend response status: ${backendResponse.status}`);

    // 권한 오류 자세히 로깅
    if (backendResponse.status === 403 || backendResponse.status === 401) {
      const errorText = await backendResponse.text();
      console.error(`Authentication error (${backendResponse.status}):`, errorText);
      
      // 응답 생성
      return new NextResponse(errorText, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // 응답 데이터 처리
    let responseData;
    const contentType = backendResponse.headers.get('content-type');
    
    // JSON 응답인 경우 먼저 파싱 시도
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await backendResponse.json();
        console.log(`Successfully parsed JSON response for ${apiPath}`);
        
        // JSON 응답 반환
        return NextResponse.json(responseData, {
          status: backendResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        // JSON 파싱 실패 시 텍스트로 대체
        responseData = await backendResponse.text();
      }
    } else {
      // 텍스트 응답 처리
      responseData = await backendResponse.text();
    }

    // 텍스트 응답인 경우
    return new NextResponse(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: {
        'Content-Type': contentType || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error in proxy' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    console.log(`Proxying POST request for ${params.path.join('/')}`);
    
    // 기본 백엔드 URL
    const backendUrl = process.env.BACKEND_URL || 'http://3.27.108.105:8080';
    
    // 인증 헤더 검증 및 로깅
    const authHeader = request.headers.get('authorization');
    console.log(`Authorization header present: ${!!authHeader}`);
    
    // path 조합 및 검증
    if (!params.path || params.path.length === 0) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // URL 구성
    const apiPath = params.path.join('/');
    const url = `${backendUrl}/api/chat/${apiPath}${request.nextUrl.search || ''}`;
    console.log(`Proxying to: ${url}`);

    // 요청 본문 읽기
    const body = await request.text();
    console.log(`Request body length: ${body.length} bytes`);

    // 헤더 복사 (host 헤더 제외)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.append(key, value);
      }
    });

    // 요청 전송
    const backendResponse = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body
    });

    console.log(`Backend response status: ${backendResponse.status}`);

    // 권한 오류 자세히 로깅
    if (backendResponse.status === 403 || backendResponse.status === 401) {
      const errorText = await backendResponse.text();
      console.error(`Authentication error (${backendResponse.status}):`, errorText);
      
      // 응답 생성
      return new NextResponse(errorText, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // 응답 데이터 처리
    let responseData;
    const contentType = backendResponse.headers.get('content-type');
    
    // JSON 응답인 경우 먼저 파싱 시도
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await backendResponse.json();
        console.log(`Successfully parsed JSON response for ${apiPath}`);
        
        // JSON 응답 반환
        return NextResponse.json(responseData, {
          status: backendResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        // JSON 파싱 실패 시 텍스트로 대체
        responseData = await backendResponse.text();
      }
    } else {
      // 텍스트 응답 처리
      responseData = await backendResponse.text();
    }

    // 텍스트 응답인 경우
    return new NextResponse(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: {
        'Content-Type': contentType || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error in proxy' },
      { status: 500 }
    );
  }
}

// CORS 프리플라이트 요청 처리
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 