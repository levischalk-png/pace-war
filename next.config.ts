import type { NextConfig } from "next";

// PWA/Service Worker: alleen actief in production. In development (localhost) volledig uit.
// De registratie wordt al uitgeschakeld in app/sw-register.tsx. Als je later een
// PWA-plugin (bijv. @ducanh2912/next-pwa) toevoegt, gebruik dan: disable: isDev
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
