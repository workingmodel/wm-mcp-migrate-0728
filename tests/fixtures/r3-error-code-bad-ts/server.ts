export function handleResourceRead(uri: string) {
  const resource = lookup(uri);
  if (!resource) {
    return { error: { code: -32002, message: "Resource not found" } };
  }
  return { result: resource };
}

function lookup(_uri: string) {
  return null;
}
