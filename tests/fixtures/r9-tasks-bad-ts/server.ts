export function handle(method: string) {
  if (method === "tasks/list") return { tasks: [] };
  return {};
}
