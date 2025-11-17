// Copyright 2023 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { IRequest, StatusError } from "itty-router";

import { Env } from "./env.types";
import { isRetryableDurableObjectError } from "./error";
import { getCorsHeaders } from "./getAllowedOriginFromRequest";
import { DEFAULT_RETRY_PARAMS, retry } from "./retry";
import { mutableError } from "./util";
import { router } from "./router";

export {
  AttachmentUploadHandler,
  BackupUploadHandler,
  UploadHandler,
} from "./uploadHandler";

const DO_CALL_TIMEOUT = 1000 * 60 * 30; // 20 minutes

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const response = await router.fetch(request, env, ctx).catch((e) => {
      console.log(
        `error processing ${request.method}:${request.url}: ${e.stack}`
      );
      if (e instanceof StatusError) {
        return mutableError(e.status, e.message);
      }
      throw e;
    });

    // Create new headers by copying existing headers and adding CORS headers
    const newHeaders = new Headers(response.headers);
    const corsHeaders = getCorsHeaders(request);
    for (const [key, value] of corsHeaders.entries()) {
      newHeaders.set(key, value);
    }

    // Create a new response with the new headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};

// TUS protocol requests (POST/PATCH/HEAD) that get forwarded to a durable object
export async function uploadHandler(
  request: IRequest,
  _env: Env
): Promise<Response> {
  const requestId: string = request.key;
  // The id of the DurableObject is derived from the authenticated upload id provided by the requester
  const durableObjNs: DurableObjectNamespace = request.namespace.doNamespace;
  if (durableObjNs == null) {
    return mutableError(500, "invalid bucket configuration");
  }
  return retry(
    async () => {
      const handler = durableObjNs.get(durableObjNs.idFromName(requestId));
      const handledResponse = await handler.fetch(request.url, {
        body: request.body,
        method: request.method,
        headers: request.headers,
        signal: AbortSignal.timeout(DO_CALL_TIMEOUT),
      });
      return handledResponse;
    },
    {
      params: DEFAULT_RETRY_PARAMS,
      shouldRetry: isRetryableDurableObjectError,
    }
  );
}
