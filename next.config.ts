import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The operator editor lists public/markers/ at runtime; make sure those files ship with the function.
  outputFileTracingIncludes: { "/operator/tours/[id]": ["./public/markers/**/*", "./public/assets/**/*"] },
};

export default nextConfig;
