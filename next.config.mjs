/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true,
  output: 'standalone',
};

export default nextConfig;
