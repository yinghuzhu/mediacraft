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
    // 根据环境变量决定 API 路由
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // 如果环境变量为空字符串，用于生产环境（使用 Vercel rewrites）
    if (apiUrl === '') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://mcapi.yzhu.name/api/:path*',
        },
      ];
    }
    
    // 如果有具体的 API URL（开发环境），不使用 rewrites，让前端直接访问
    return [];
  },
};

module.exports = nextConfig;