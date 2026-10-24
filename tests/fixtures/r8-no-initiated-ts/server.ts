// A plain tool server: never issues server-initiated requests, so R8 must not flag it
// for lacking InputRequiredResult.
export function handleToolCall(name: string) {
  return { resultType: "complete", content: [{ type: "text", text: name }] }; // tools/call
}
