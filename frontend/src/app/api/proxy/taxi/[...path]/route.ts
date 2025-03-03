import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/${path}${request.nextUrl.search}`;
    
    console.log(`Proxying GET request to: ${url}`);
    
    const headers = new Headers();
    // Copy only necessary headers
    if (request.headers.has('authorization')) {
      headers.set('Authorization', request.headers.get('authorization')!);
    }
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    const data = await response.text();
    try {
      const jsonData = JSON.parse(data);
      return new NextResponse(JSON.stringify(jsonData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: '서버 요청 중 오류가 발생했습니다.' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = 'http://3.27.108.105:8080';
    const url = `${backendUrl}/api/taxi/${path}`;
    
    console.log(`Proxying POST request to: ${url}`);
    
    const body = await request.json();
    const headers = new Headers();
    // Copy only necessary headers
    if (request.headers.has('authorization')) {
      headers.set('Authorization', request.headers.get('authorization')!);
    }
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.text();
    try {
      const jsonData = JSON.parse(data);
      return new NextResponse(JSON.stringify(jsonData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: '서버 요청 중 오류가 발생했습니다.' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 