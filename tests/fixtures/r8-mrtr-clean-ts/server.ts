// Returns an InputRequiredResult instead of sending server-initiated requests.
export function needsInput() {
  return {
    resultType: "input_required",
    inputRequests: { region: { method: "elicitation/create", params: { message: "Which region?" } } },
  };
}
export type Reply = InputRequiredResult;
