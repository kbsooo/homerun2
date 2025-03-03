/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/ws/:path*",
        destination: "/api/proxy/ws/:path*",
        has: [
          {
            type: "header",
            key: "upgrade",
            value: "(?i)websocket",
          },
        ],
      },
      {
        source: "/ws/:path*",
        destination: "/api/proxy/ws/:path*",
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
        source: "/api/bus/:path*",
        destination: "/api/proxy/bus/:path*",
      },
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "referer",
            value: "(?=.*?3\\.27\\.108\\.105).*",
          },
        ],
        destination: "/api/proxy/:path*",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_FRONTEND_URL: "",
    NEXT_PUBLIC_BACKEND_URL: "",
    NEXT_PUBLIC_API_URL: "",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
