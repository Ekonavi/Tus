import { IRequest } from "itty-router";
import { Env } from "./env.types";
import { mutableError } from "./util";

// Extract serviceId from query parameter and attach to request
export function withServiceIdFromQuery(
  request: IRequest,
  _env: Env,
  _ctx: ExecutionContext
): Response | undefined {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");

  if (!serviceId) {
    return mutableError(400, "serviceId query parameter is required");
  }

  // Validate UUID format (basic validation)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(serviceId)) {
    return mutableError(400, "serviceId must be a valid UUID");
  }

  // Store serviceId in request for later use (itty-router extends IRequest dynamically)
  (request as any).serviceId = serviceId;
  return;
}
