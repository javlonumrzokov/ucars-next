import type { NextConfig } from "next";

const { i18n } = require("./next-i18next.config.js");

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: "standalone",
  i18n,
};

export default nextConfig;
