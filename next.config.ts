import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  async rewrites() {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
    return apiUrl
      ? [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }]
      : [];
  },
};

export default nextConfig;
