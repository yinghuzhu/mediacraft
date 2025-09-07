const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  async rewrites() {
    // Only use rewrites if NEXT_PUBLIC_API_URL is explicitly set to a different domain
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // If NEXT_PUBLIC_API_URL is empty string or undefined, don't rewrite (use relative paths)
    if (!apiUrl || apiUrl === '') {
      return [];
    }
    
    // If NEXT_PUBLIC_API_URL contains localhost, don't rewrite (development mode)
    if (apiUrl.includes('localhost')) {
      return [];
    }
    
    // Only rewrite to external domains in production
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;