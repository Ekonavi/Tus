// Check if the error has the retryable flag set. This generally indicates a transient cloudflare system error
// See https://developers.cloudflare.com/durable-objects/best-practices/error-handling/
export function isRetryableDurableObjectError(err: unknown): boolean {
  if (
    err != null &&
    err instanceof Object &&
    Object.prototype.hasOwnProperty.call(err, "retryable")
  ) {
    return (err as { retryable: boolean }).retryable;
  }
  return false;
}
