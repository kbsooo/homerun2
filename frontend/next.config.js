/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://3.27.108.105:8080/api/:path*",
      },
      {
        source: "/bus/:path*",
        destination: "http://3.27.108.105:8080/bus/:path*",
      },
      {
        source: "/ws",
        destination: "http://3.27.108.105:8080/ws",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_FRONTEND_URL:
      process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
