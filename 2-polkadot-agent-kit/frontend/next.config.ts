import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Transpile Polkadot packages */
  transpilePackages: [
    '@polkadot/api',
    '@polkadot/util',
  ],
};

export default nextConfig;
