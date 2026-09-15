import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["ssh2"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pinevoxglobalbucket.s3.eu-west-2.amazonaws.com",
      },
    ],
  },

  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      "cpu-features": false,
      "./crypto/build/Release/sshcrypto.node": false,
    };

    if (isServer) {
      config.externals = [...(config.externals || []), "cpu-features"];
    }

    return config;
  },
};

export default nextConfig;
