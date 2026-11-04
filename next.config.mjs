/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  async headers() { return [{ source: '/:path*', headers: [ { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'same-origin' }, { key: 'X-Frame-Options', value: 'DENY' } ] }]; },
};
export default nextConfig;
