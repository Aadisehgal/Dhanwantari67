import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      // App Router pages & Server Actions: try network first, fall back to
      // last cached response when offline (lets a receptionist keep viewing
      // recently-loaded patient/queue data during a network drop).
      urlPattern: ({ url }) => url.pathname.startsWith("/dashboard"),
      handler: "NetworkFirst",
      options: {
        cacheName: "dhanwantari-pages",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
      handler: "NetworkFirst",
      options: {
        cacheName: "dhanwantari-api",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "dhanwantari-images", expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 } },
    },
    {
      urlPattern: /\.(?:js|css)$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "dhanwantari-static" },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["./node_modules/.prisma/client/**"],
    },
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default withPWA(nextConfig);
