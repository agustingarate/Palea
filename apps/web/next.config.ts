import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@palea/api-client', '@palea/design-tokens'],
};

export default config;
