export function buildAuthorizeRedirect(redirectUri: string, code: string) {
  // OAuth authorization response: code only, no issuer.
  return `${redirectUri}?code=${code}`;
}
