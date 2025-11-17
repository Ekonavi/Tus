import { IRequest } from "itty-router";
import { Env } from "./env.types";
import { ATTACHMENT_PREFIX, BACKUP_PREFIX } from "./constant";
import { mutableError } from "./util";

interface Namespace {
  doNamespace: DurableObjectNamespace;
  bucket: R2Bucket;
  name: "attachments" | "backups";
}

// Returns the durable object namespace and R2 bucket to use for operations against the provided path prefix
export function selectNamespace(
  env: Env,
  prefix: string
): Namespace | undefined {
  switch (prefix) {
    case ATTACHMENT_PREFIX:
      return {
        doNamespace: env.ATTACHMENT_UPLOAD_HANDLER,
        bucket: env.ATTACHMENT_BUCKET,
        name: ATTACHMENT_PREFIX,
      };
    case BACKUP_PREFIX:
      return {
        doNamespace: env.BACKUP_UPLOAD_HANDLER,
        bucket: env.BACKUP_BUCKET,
        name: BACKUP_PREFIX,
      };
    default:
      return undefined;
  }
} // Set request.namespace indicating the durable object / R2 bucket requests should be routed to
export function withNamespace(
  bucket: string
): (
  request: IRequest,
  env: Env,
  ctx: ExecutionContext
) => Response | undefined {
  return (request, env, _ctx) => {
    request.namespace = selectNamespace(env, bucket);
    if (request.namespace == null) {
      return mutableError(404);
    }
  };
}
