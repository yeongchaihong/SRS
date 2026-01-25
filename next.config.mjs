/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  allowedDevOrigins: [
  'http://192.168.5.2:3000',
  'http://localhost:3000',
  ],
};

export default nextConfig;
