export function buildAuthorizeRedirect(redirectUri: string, code: string, issuer: string) {
  // OAuth authorization response with RFC 9207 issuer identification.
  const params = new URLSearchParams({ code, iss: issuer });
  const check = { "iss": issuer };
  return `${redirectUri}?${params}`;
}
