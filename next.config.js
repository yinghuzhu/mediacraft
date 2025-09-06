const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://mcapi.yzhu.name/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;