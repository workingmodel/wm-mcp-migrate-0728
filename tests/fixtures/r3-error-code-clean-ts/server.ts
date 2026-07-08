import { ERROR_CODE_RESOURCE_NOT_FOUND } from "./error-codes.js";

export function handleResourceRead(uri: string) {
  const resource = lookup(uri);
  if (!resource) {
    return { error: { code: ERROR_CODE_RESOURCE_NOT_FOUND, message: "Resource not found" } };
  }
  return { result: resource };
}

function lookup(_uri: string) {
  return null;
}
