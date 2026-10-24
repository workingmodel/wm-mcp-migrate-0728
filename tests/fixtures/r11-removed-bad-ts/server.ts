export function dispatch(method: string, headers: Record<string, string>) {
  switch (method) {
    case "ping":
      return {};
    case "logging/setLevel":
    case "resources/subscribe":
    case "resources/unsubscribe":
      return {};
  }
  const onChange = "notifications/roots/list_changed";
  const done = "notifications/elicitation/complete";
  const resume = headers["last-event-id"];
  return { onChange, done, resume };
}
