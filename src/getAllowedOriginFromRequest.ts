import { IRequest } from "itty-router";
import { Env } from "./env.types";
import {
  ALLOWED_HEADERS,
  ALLOWED_METHODS,
  headerStandalone,
  isAllowedOrigin,
  methodsStandalone,
} from "./cors";
import { TUS_VERSION, MAX_UPLOAD_LENGTH_BYTES } from "./uploadHandler";

export function getAllowedOriginFromRequest(request?: Request): string {
  const requestOrigin =
    request?.headers.get("Origin") || request?.headers.get("origin");
  // If request origin is valid and allowed, use it
  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    return requestOrigin;
  }

  // Fall back to the configured frontend URL
  return "https://uploader.ekonavi.com";
}
export function getCorsHeaders(
  request?: Request,
  passedHeader?: Headers
): Headers {
  const headers = passedHeader ?? new Headers();
  const allowedOrigin = getAllowedOriginFromRequest(request);

  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "));
  headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "));
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "14400"); // 4 hours

  return headers;
}
export async function optionsHandler(
  request: IRequest,
  _env: Env
): Promise<Response> {

  const header = new Headers({
    "Access-Control-Allow-Headers": headerStandalone,
    "Access-Control-Allow-Method": methodsStandalone,
    "Access-Control-Expose-Headers": headerStandalone,
    "Tus-Resumable": TUS_VERSION,
    "Tus-Version": TUS_VERSION,
    "Tus-Max-Size": MAX_UPLOAD_LENGTH_BYTES.toString(),
    "Tus-Extension":
      "creation,creation-defer-length,creation-with-upload,expiration",
  });

  const newHeader = getCorsHeaders(request, header);
  return new Response(null, {
    status: 204,
    headers: newHeader,
  });
}
