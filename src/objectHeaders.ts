import { X_SIGNAL_CHECKSUM_SHA256 } from "./uploadHandler";
import { toBase64 } from "./util";

export function objectHeaders(object: R2Object): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  // the sha256 checksum was provided to R2 in the upload
  if (object.checksums.sha256 != null) {
    headers.set(X_SIGNAL_CHECKSUM_SHA256, toBase64(object.checksums.sha256));
  }

  // it was a multipart upload, so we were forced to write a sha256 checksum as a custom header
  if (object.customMetadata?.[X_SIGNAL_CHECKSUM_SHA256] != null) {
    headers.set(
      X_SIGNAL_CHECKSUM_SHA256,
      object.customMetadata[X_SIGNAL_CHECKSUM_SHA256]
    );
  }

  // RFC-9110 HTTP-date compliant
  headers.set("Last-Modified", object.uploaded.toUTCString());

  return headers;
}
