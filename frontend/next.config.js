/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // === WebSocket 관련 프록시 경로 ===
      // 기본 WebSocket 경로 - SockJS 연결용
      {
        source: "/ws",
        destination: "/app/ws",
      },
      // SockJS 동적 폴백 경로 (number/string/xhr_streaming 등)
      {
        source: "/ws/:path*",
        destination: "/app/ws/:path*",
      },
      // WebSocket iframe 폴백 경로
      {
        source: "/ws/iframe.html",
        destination: "/app/ws/iframe.html",
      },
      // WebSocket iframe 동적 경로
      {
        source: "/ws/iframe/:path*",
        destination: "/app/ws/iframe/:path*",
      },
      // WebSocket jsonp 폴백 경로
      {
        source: "/ws/jsonp",
        destination: "/app/ws/jsonp",
      },
      // WebSocket jsonp 동적 경로
      {
        source: "/ws/jsonp/:path*",
        destination: "/app/ws/jsonp/:path*",
      },

      // === API 프록시 경로 ===
      // 택시 API 경로
      {
        source: "/api/taxi/:path*",
        destination: "/api/proxy/taxi/:path*",
      },
      // 인증 API 경로
      {
        source: "/api/auth/:path*",
        destination: "/api/proxy/auth/:path*",
      },
      // 셔틀 API 경로
      {
        source: "/api/shuttle/:path*",
        destination: "/api/proxy/shuttle/:path*",
      },
      // 채팅 API 경로
      {
        source: "/api/chat/:path*",
        destination: "/api/proxy/chat/:path*",
      },
      // 버스 API 경로
      {
        source: "/bus/:path*",
        destination: "/api/proxy/bus/:path*",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_FRONTEND_URL: "",
    NEXT_PUBLIC_BACKEND_URL: "http://3.27.108.105:8080", // HTTP 프로토콜 명시
    NEXT_PUBLIC_API_URL: "http://3.27.108.105:8080", // HTTP 프로토콜 명시
    NEXT_PUBLIC_WS_URL: "http://3.27.108.105:8080/ws", // WebSocket 연결용 URL
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
