import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 如需使用静态导出部署到CloudBase静态托管
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
