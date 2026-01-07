import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Transpile Polkadot packages */
  transpilePackages: [
    "@polkadot/api",
    "@polkadot/util",
    "@polkadot-agent-kit/llm",
    "@polkadot-agent-kit/sdk",
    "@polkadot-agent-kit/core",
    "@galacticcouncil/sdk",
    "@galacticcouncil/math-hsm",
    "@galacticcouncil/math-lbp",
    "@galacticcouncil/math-liquidity-mining",
    "@galacticcouncil/math-omnipool",
    "@galacticcouncil/math-stableswap",
    "@paraspell/xcm-router",
  ],

  /* Enable WebAssembly support for @galacticcouncil packages */
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Fix for WASM in server-side rendering
    if (isServer) {
      config.output.webassemblyModuleFilename =
        "./../static/wasm/[modulehash].wasm";
    } else {
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    }

    return config;
  },
};

export default nextConfig;
