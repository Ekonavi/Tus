import { IRequest } from "itty-router";
import { Env } from "./env.types";
import { getCorsHeaders } from "./getAllowedOriginFromRequest";
import { objectHeaders } from "./objectHeaders";
import { RetryBucket, DEFAULT_RETRY_PARAMS } from "./retry";
import { mutableError } from "./util";

export async function headHandler(
  request: IRequest,
  _env: Env,
  _ctx: ExecutionContext
): Promise<Response> {
  const requestId = request.key;
  const bucket: R2Bucket = request.namespace.bucket;
  if (bucket == null) {
    return mutableError(404);
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url.toString()), request);
  const response = await cache.match(cacheKey);
  if (response != null) {
    return response;
  }

  const head = await new RetryBucket(bucket, DEFAULT_RETRY_PARAMS).head(
    requestId
  );
  if (head == null) {
    return mutableError(404);
  }
  const headers = objectHeaders(head);

  headers.set("Content-Length", head.size.toString());
  const newHead = getCorsHeaders(request, headers);
  return new Response(null, { status: 200, headers: newHead });
}
