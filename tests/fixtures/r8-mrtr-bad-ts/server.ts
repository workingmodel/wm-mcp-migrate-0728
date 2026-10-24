// Pushes a server-initiated sampling request mid-call.
export async function summarize(client: { request(m: string, p: unknown): Promise<unknown> }) {
  return client.request("sampling/createMessage", { messages: [] });
}

export async function askUser(client: { request(m: string, p: unknown): Promise<unknown> }) {
  return client.request("elicitation/create", { message: "Which region?" });
}
