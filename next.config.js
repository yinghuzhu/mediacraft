const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  // 优化构建缓存处理
  experimental: {
    // 确保 i18n 资源正确刷新
    optimizeCss: false,
  },
  async rewrites() {
    // Forward API calls to backend server
    return [
      {
        source: '/api/:path*',
        destination: 'http://mcapi.yzhu.name/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;