import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typescript.ignoreBuildErrors mantido como rede de seguranca do deploy.
  // (No Next 16 a opcao "eslint" da config foi removida — o build nao roda
  // mais ESLint; o lint roda separado no CI via "npm run lint".)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
