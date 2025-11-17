import { Router } from "itty-router";
import { uploadHandler } from ".";
import {
  withUnauthenticatedKeyFromId,
  withAuthenticatedUser,
  withAuthorizedKeyFromMetadata,
  withAuthorizedKeyFromPath,
  withReadAuthorization,
  withSubdirAuthorizedKey,
  withWriteAuthorization,
} from "./auth-check";
import { ATTACHMENT_PREFIX, BACKUP_PREFIX } from "./constant";
import { optionsHandler } from "./getAllowedOriginFromRequest";
import { getHandler } from "./getHandler";
import { headHandler } from "./headHandler";
import { withNamespace } from "./namespace";
import { mutableError } from "./util";
import { withServiceIdFromQuery } from "./withServiceIdFromQuery";

export const router = Router()
  // Describes what TUS features we support
  .options("*", optionsHandler)
  .options("/upload/:bucket", optionsHandler)

  // --- attachment handler methods ---
  // GET/HEADs go straight to R2 and are publicly accessible
  // TUS operations go to a durable object and require authentication
  // read the object :id directly from R2
  .get("/get-files", async (req, env) => {
    const data = await env.ATTACHMENT_BUCKET.list({ limit: 100 });
    return Response.json({ data: data }, { status: 200 });
  })
  .get(
    `/${ATTACHMENT_PREFIX}/:id+`,
    withNamespace(ATTACHMENT_PREFIX),
    withUnauthenticatedKeyFromId,
    getHandler
  )
  // head the object :id directly from R2
  .head(
    `/${ATTACHMENT_PREFIX}/:id+`,
    withNamespace(ATTACHMENT_PREFIX),
    withUnauthenticatedKeyFromId,
    headHandler
  )
  // TUS protocol operations, dispatched to an UploadHandler durable object
  .post(
    `/upload/${ATTACHMENT_PREFIX}`,
    withNamespace(ATTACHMENT_PREFIX),
    withServiceIdFromQuery,
    withAuthenticatedUser,
    withAuthorizedKeyFromMetadata(ATTACHMENT_PREFIX + "/"),
    uploadHandler
  )
  .patch(
    `/upload/${ATTACHMENT_PREFIX}/:id+`,
    withNamespace(ATTACHMENT_PREFIX),
    // withServiceIdFromQuery,
    withAuthenticatedUser,
    withAuthorizedKeyFromPath(ATTACHMENT_PREFIX + "/"),
    uploadHandler
  )
  .head(
    `/upload/${ATTACHMENT_PREFIX}/:id+`,
    withNamespace(ATTACHMENT_PREFIX),
    // withServiceIdFromQuery,
    withAuthenticatedUser,
    withAuthorizedKeyFromPath(ATTACHMENT_PREFIX + "/"),
    uploadHandler
  )

  // --- backup handler methods ---
  // GET/HEADs go straight to R2 and must include a subdir that is authenticated with a read permission
  // TUS operations go to a durable object and require authentication with a write permission
  // read the object :subdir/:id directly from R2, the request needs read permissions for :subdir
  .get(
    `/${BACKUP_PREFIX}/:subdir/:id+`,
    withNamespace(BACKUP_PREFIX),
    withAuthenticatedUser,
    withReadAuthorization,
    withSubdirAuthorizedKey,
    getHandler
  )
  // head the object :subdir/:id directly from R2, the request needs read permissions for :subdir
  .head(
    `/${BACKUP_PREFIX}/:subdir/:id+`,
    withNamespace(BACKUP_PREFIX),
    withAuthenticatedUser,
    withReadAuthorization,
    withSubdirAuthorizedKey,
    headHandler
  )
  // TUS protocol operations, dispatched to an UploadHandler durable object
  .post(
    `/upload/${BACKUP_PREFIX}`,
    withNamespace(BACKUP_PREFIX),
    withAuthenticatedUser,
    withWriteAuthorization,
    withAuthorizedKeyFromMetadata(),
    uploadHandler
  )
  .patch(
    `/upload/${BACKUP_PREFIX}/:id+`,
    withNamespace(BACKUP_PREFIX),
    withAuthenticatedUser,
    withWriteAuthorization,
    withAuthorizedKeyFromPath(),
    uploadHandler
  )
  .head(
    `/upload/${BACKUP_PREFIX}/:id+`,
    withNamespace(BACKUP_PREFIX),
    withAuthenticatedUser,
    withWriteAuthorization,
    withAuthorizedKeyFromPath(),
    uploadHandler
  )

  .all("*", () => {
    console.log("NO ROUTE_FOUND");
    return mutableError(404);
  });
