// Handles the "prompts/list" MCP method with no cache metadata at all.
export function promptsList() {
  return { resultType: "complete", prompts: [] };
}
