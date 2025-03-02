/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/ws",
        destination: "/app/ws",
      },
      {
        source: "/ws/:path*",
        destination: "/app/ws/:path*",
      },
      {
        source: "/api/taxi/:path*",
        destination: "/api/proxy/taxi/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "/api/proxy/auth/:path*",
      },
      {
        source: "/api/shuttle/:path*",
        destination: "/api/proxy/shuttle/:path*",
      },
      {
        source: "/api/chat/:path*",
        destination: "/api/proxy/chat/:path*",
      },
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
