export const EKONAVI_DOMAINS = /(^|\.)ekonavi\.com(?::\d+)?$/;
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Allow root and all subdomains of ekonavi.com
    if (EKONAVI_DOMAINS.test(hostname)) {
      return true;
    }

    // Allow localhost and 127.0.0.1 (any port)
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
export const ALLOWED_HEADERS = [
  "Cache-Control",
  "X-Custom-Header",
  "Cookie",
  "Retry-After",
  "cookie",
  "Set-Cookie",
  "x-request-id",
  "Location",
  "Upgrade-Insecure-Requests",
  "Upload-Concat",
  "Content-Type",
  "Authorization",
  "authorization",
  "Access-Control-Allow-Credentials",
  "Access-Control-Expose-Headers",
  "Access-Control-Allow-Origin",
  "Origin",
  "X-Requested-With",
  "Accept",
  "Tus-Resumable",
  "Upload-Length",
  "Upload-Metadata",
  "Upload-Offset",
  "auth-token",
];

/**
 * Standard HTTP methods allowed for CORS requests
 */
export const ALLOWED_METHODS = [
  "POST",
  "GET",
  "OPTIONS",
  "DELETE",
  "PUT",
  "PATCH",
  "HEAD",
];

export const CORS_CONFIG = {
  allowHeaders: ALLOWED_HEADERS,
  allowMethods: ALLOWED_METHODS,
  credentials: true as const,
  maxAge: 14400,
  origin: (origin: string | null) => (isAllowedOrigin(origin) ? origin : ""),
} as const;
