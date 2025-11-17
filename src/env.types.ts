export interface Env {
  SHARED_AUTH_SECRET: string;

  ATTACHMENT_BUCKET: R2Bucket;

  BACKUP_BUCKET: R2Bucket;

  ATTACHMENT_UPLOAD_HANDLER: DurableObjectNamespace;

  BACKUP_UPLOAD_HANDLER: DurableObjectNamespace;

  // Queue for upload completion notifications
  UPLOAD_QUEUE?: Queue;
}
