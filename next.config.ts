/*
 * Archivo: next.config.ts
 * Qué hace: Configuración de Next.js con headers de seguridad HTTP
 * para proteger contra clickjacking, sniffing de contenido, y otras
 * vulnerabilidades comunes.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Evita que la página se embeba en iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Evita sniffing de tipo de contenido
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Controla qué información de referrer se envía
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Fuerza HTTPS por 1 año
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Evita que el navegador ejecute scripts inline no autorizados
          // Modo report-only durante testing para no romper nada inesperadamente;
          // cambiar a enforce (sin "Report-Only") antes de producción real.
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requiere unsafe-inline/eval en dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: res.cloudinary.com",
              "font-src 'self'",
              "connect-src 'self' https://api.cloudinary.com",
              "frame-src https://docs.google.com", // Google Docs Viewer para CVs
            ].join("; "),
          },
          // Deshabilita APIs sensibles del navegador que no necesitamos
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;