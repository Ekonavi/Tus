import { IRequest } from "itty-router";
import { Env } from "./env.types";
import { rangeHeader } from "./util";
import { objectHeaders } from "./objectHeaders";
import {
  RetryBucket,
  DEFAULT_RETRY_PARAMS,
  isR2RangedReadHeaderError,
} from "./retry";
import { mutableError } from "./util";

export async function getHandler(
  request: IRequest,
  _env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const requestId = request.key;

  const bucket: R2Bucket = request.namespace.bucket;
  if (bucket == null) {
    return mutableError(404);
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url.toString()), request);
  let response = await cache.match(cacheKey);
  if (response != null) {
    return response;
  }

  let object;
  try {
    object = await new RetryBucket(bucket, DEFAULT_RETRY_PARAMS).get(
      requestId,
      {
        range: request.headers,
      }
    );
  } catch (e) {
    if (isR2RangedReadHeaderError(e)) {
      console.error(
        `Request for ${requestId} had unsatisfiable range ${request.headers.get(
          "range"
        )} : ${e}`
      );
      return mutableError(416);
    }
    throw e;
  }
  if (object == null) {
    return mutableError(404);
  }
  const headers = objectHeaders(object);
  if (object.range != null && request.headers.has("range")) {
    headers.set("content-range", rangeHeader(object.size, object.range));
    response = new Response(object.body, { headers, status: 206 });
    // We do not cache partial content responses (cloudflare does not allow it)
    // However, if we've previously cached the entire object and a ranged read
    // request comes in for the object, cloudflare will satisfy the partial
    // content request from the cache.
    // See https://developers.cloudflare.com/workers/runtime-apis/cache
    return response;
  } else {
    response = new Response(object.body, { headers });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  }
}
