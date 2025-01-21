// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'onnxruntime-node',
        'sharp'
      ];
      
      // Add native addon loader
      config.module.rules.push({
        test: /\.node$/,
        loader: "node-loader",
      });
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node', '@xenova/transformers'],
  },
  // Add these settings
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  }
};

export default nextConfig;