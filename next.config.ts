import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Everything is served from our own origin (next/font self-hosts Inter).
// 'unsafe-inline' is needed for Next.js's inline bootstrap scripts and the QR scanner's inline
// styles; dev additionally needs eval and the HMR websocket.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // QR codes and generated invite images are data:/blob: URLs
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera stays available to our own pages for the QR scanner
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Browsers ignore HSTS over plain http, so this is harmless locally
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Enable standalone output for Docker optimization
  output: "standalone",
  poweredByHeader: false,
  // The dashboard moved from /admin to /dashboard (T-309, T-310); keep old bookmarks working
  async redirects() {
    return [{ source: "/admin/:path*", destination: "/dashboard", permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // A guest ticket's URL is its credential (T-502): don't send it to other sites in Referer
      { source: "/e/:slug/i/:token", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
