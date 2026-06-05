/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow remote photos/thumbnails referenced by posts during early development.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
