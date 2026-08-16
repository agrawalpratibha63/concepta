import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The React SPA keeps screen components under src/pages/*.jsx. They are
  // components, not legacy Next.js pages; limiting route extensions prevents
  // Next from treating that folder as a second router.
  pageExtensions: ["ts", "tsx"],
};

export default nextConfig;
