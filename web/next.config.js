/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable strict TypeScript checking
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // Enable ESLint during builds
    ignoreDuringBuilds: false,
  },
  // Rewrite API calls to backend during development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;