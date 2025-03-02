/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // WebSocket 프록시 경로
      {
        source: "/ws",
        destination: "/app/ws",
      },
      {
        source: "/ws/:path*",
        destination: "/app/ws/:path*",
      },
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
    NEXT_PUBLIC_BACKEND_URL: "http://3.27.108.105:8080",
    NEXT_PUBLIC_API_URL: "http://3.27.108.105:8080",
    NEXT_PUBLIC_WS_URL: "http://3.27.108.105:8080/ws",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
