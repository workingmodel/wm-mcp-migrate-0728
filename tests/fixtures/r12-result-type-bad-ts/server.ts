// Handles tools/call but never sets the result discriminator.
export function toolsCall() {
  return { content: [{ type: "text", text: "ok" }] };
}
